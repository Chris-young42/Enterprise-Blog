import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as geoip from 'geoip-lite';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { existsSync, readdirSync } from 'fs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type GeoLocation = {
  country: string;
  region: string;
  city: string;
  timezone: string;
  ll: [number, number] | null;
  asn: string | null;
};

@Injectable()
export class GeoipService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  lookup(ip?: string): GeoLocation {
    const enabled = (this.configService.get<string>('app.geoipEnabled') ?? 'true') === 'true';
    const normalized = normalizeIp(ip);
    if (!enabled || !normalized) return unknownLocation();
    try {
      const result = geoip.lookup(normalized);
      if (!result) return unknownLocation();
      return {
        country: result.country ?? 'unknown',
        region: result.region ?? 'unknown',
        city: result.city ?? 'unknown',
        timezone: result.timezone ?? 'unknown',
        ll:
          Array.isArray(result.ll) &&
          result.ll.length === 2 &&
          typeof result.ll[0] === 'number' &&
          typeof result.ll[1] === 'number'
            ? [result.ll[0], result.ll[1]]
            : null,
        asn: null,
      };
    } catch {
      return unknownLocation();
    }
  }

  async updateDatabase() {
    const licenseKey = (this.configService.get<string>('app.geoipLicenseKey') ?? '').trim();
    if (!licenseKey) {
      return { success: false, message: 'GEOIP_LICENSE_KEY is required', output: '' };
    }

    const scriptPath = resolveGeoipUpdateScriptPath();
    const nodeCmd = process.execPath;
    const args = [scriptPath, `license_key=${licenseKey}`];
    const output = await runProcess(nodeCmd, args, resolve(process.cwd()), 10 * 60 * 1000);
    geoip.reloadDataSync();
    return { success: true, message: 'geoip database updated', output };
  }

  reload() {
    geoip.reloadDataSync();
    return { success: true, message: 'geoip data reloaded' };
  }

  validateAccuracy(samples: Array<{ ip: string; country?: string; city?: string }>) {
    const checked = samples
      .map((sample) => {
        const lookup = this.lookup(sample.ip);
        const countryMatch = sample.country ? lookup.country === sample.country : null;
        const cityMatch = sample.city ? lookup.city === sample.city : null;
        return {
          ip: sample.ip,
          expectedCountry: sample.country ?? null,
          expectedCity: sample.city ?? null,
          actualCountry: lookup.country,
          actualCity: lookup.city,
          countryMatch,
          cityMatch,
        };
      });

    const countryTotal = checked.filter((item) => item.expectedCountry !== null).length;
    const countryMatched = checked.filter((item) => item.countryMatch === true).length;
    const cityTotal = checked.filter((item) => item.expectedCity !== null).length;
    const cityMatched = checked.filter((item) => item.cityMatch === true).length;

    return {
      summary: {
        countryAccuracy: countryTotal === 0 ? null : Number(((countryMatched / countryTotal) * 100).toFixed(2)),
        cityAccuracy: cityTotal === 0 ? null : Number(((cityMatched / cityTotal) * 100).toFixed(2)),
      },
      checked,
    };
  }

  async saveValidationHistory(input: {
    summary: { countryAccuracy: number | null; cityAccuracy: number | null };
    checked: Array<{
      ip: string;
      expectedCountry: string | null;
      expectedCity: string | null;
      actualCountry: string;
      actualCity: string;
      countryMatch: boolean | null;
      cityMatch: boolean | null;
    }>;
  }) {
    const key = 'security.geoip_validation_history';
    const row = await this.configRow(key);
    const history = parseValidationHistory(row?.value);
    const latest = history.length > 0 ? (history[0] ?? null) : null;
    const current = {
      id: `geoipv_${Date.now()}`,
      createdAt: new Date().toISOString(),
      summary: input.summary,
      sampleSize: input.checked.length,
    };
    const next = [current, ...history].slice(0, 50);
    await this.upsertConfig(key, next, 'geoip validation history');

    const delta =
      latest !== null
        ? {
            countryAccuracyDelta:
              input.summary.countryAccuracy !== null && latest.summary.countryAccuracy !== null
                ? Number((input.summary.countryAccuracy - latest.summary.countryAccuracy).toFixed(2))
                : null,
            cityAccuracyDelta:
              input.summary.cityAccuracy !== null && latest.summary.cityAccuracy !== null
                ? Number((input.summary.cityAccuracy - latest.summary.cityAccuracy).toFixed(2))
                : null,
          }
        : {
            countryAccuracyDelta: null,
            cityAccuracyDelta: null,
          };

    return {
      latest: current,
      previous: latest,
      delta,
      history: next,
    };
  }

  async getValidationHistory() {
    const row = await this.configRow('security.geoip_validation_history');
    const history = parseValidationHistory(row?.value);
    const latest = history.length > 0 ? history[0] : null;
    const previous = history.length > 1 ? (history[1] ?? null) : null;
    return {
      latest,
      previous,
      history,
      delta:
        latest && previous
          ? {
              countryAccuracyDelta:
                latest.summary.countryAccuracy !== null && previous.summary.countryAccuracy !== null
                  ? Number((latest.summary.countryAccuracy - previous.summary.countryAccuracy).toFixed(2))
                  : null,
              cityAccuracyDelta:
                latest.summary.cityAccuracy !== null && previous.summary.cityAccuracy !== null
                  ? Number((latest.summary.cityAccuracy - previous.summary.cityAccuracy).toFixed(2))
                  : null,
            }
          : {
              countryAccuracyDelta: null,
              cityAccuracyDelta: null,
            },
    };
  }

  private configRow(key: string) {
    return this.prisma.siteConfig.findUnique({
      where: { key },
      select: { value: true },
    });
  }

  private async upsertConfig(key: string, value: Prisma.InputJsonValue, description: string) {
    await this.prisma.siteConfig.upsert({
      where: { key },
      update: {
        value,
        deletedAt: null,
        description,
      },
      create: {
        key,
        value,
        description,
      },
    });
  }
}

type GeoipValidationHistoryItem = {
  id: string;
  createdAt: string;
  summary: {
    countryAccuracy: number | null;
    cityAccuracy: number | null;
  };
  sampleSize: number;
};

function parseValidationHistory(raw: unknown): GeoipValidationHistoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : `geoipv_${Date.now()}`,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      summary: {
        countryAccuracy:
          typeof item.summary === 'object' &&
          item.summary !== null &&
          typeof (item.summary as Record<string, unknown>).countryAccuracy === 'number'
            ? ((item.summary as Record<string, unknown>).countryAccuracy as number)
            : null,
        cityAccuracy:
          typeof item.summary === 'object' &&
          item.summary !== null &&
          typeof (item.summary as Record<string, unknown>).cityAccuracy === 'number'
            ? ((item.summary as Record<string, unknown>).cityAccuracy as number)
            : null,
      },
      sampleSize: typeof item.sampleSize === 'number' ? Math.max(0, Math.floor(item.sampleSize)) : 0,
    }));
}

function resolveGeoipUpdateScriptPath() {
  const directCandidates = [
    resolve(process.cwd(), 'node_modules/geoip-lite/scripts/updatedb.js'),
    resolve(process.cwd(), 'apps/api/node_modules/geoip-lite/scripts/updatedb.js'),
  ];

  for (const candidate of directCandidates) {
    if (existsSync(candidate)) return candidate;
  }

  const pnpmRoot = resolve(process.cwd(), 'node_modules/.pnpm');
  if (existsSync(pnpmRoot)) {
    const matched = readdirSync(pnpmRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('geoip-lite@'))
      .map((entry) => resolve(pnpmRoot, entry.name, 'node_modules/geoip-lite/scripts/updatedb.js'))
      .find((candidate) => existsSync(candidate));
    if (matched) return matched;
  }

  throw new Error('geoip updatedb script not found, please ensure geoip-lite is installed');
}

function normalizeIp(ip?: string) {
  const value = (ip ?? '').trim();
  if (!value) return '';
  if (value === '::1') return '127.0.0.1';
  if (value.startsWith('::ffff:')) return value.slice('::ffff:'.length);
  return value;
}

function unknownLocation(): GeoLocation {
  return {
    country: 'unknown',
    region: 'unknown',
    city: 'unknown',
    timezone: 'unknown',
    ll: null,
    asn: null,
  };
}

async function runProcess(command: string, args: string[], cwd: string, timeoutMs: number) {
  return new Promise<string>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let output = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    const timer = setTimeout(() => {
      child.kill();
      rejectPromise(new Error(`geoip update timeout: ${command} ${args.join(' ')}`));
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      const merged = [output.trim(), stderr.trim()].filter((item) => item.length > 0).join('\n');
      if (code === 0) {
        resolvePromise(merged);
      } else {
        rejectPromise(new Error(merged || `geoip update failed: ${command} ${args.join(' ')}`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
  });
}
