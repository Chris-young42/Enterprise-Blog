import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { RedisService } from '../../modules/security/redis.service';
import { SecurityService } from '../../modules/security/security.service';
import { SKIP_TRAFFIC_SHIELD_KEY } from '../decorators/skip-traffic-shield.decorator';

type CounterRecord = {
  count: number;
  expiresAt: number;
};

type BurstRecord = {
  count: number;
  expiresAt: number;
};

@Injectable()
export class TrafficShieldGuard implements CanActivate {
  private readonly counters = new Map<string, CounterRecord>();
  private readonly bursts = new Map<string, BurstRecord>();

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly securityService: SecurityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRAFFIC_SHIELD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const req = context.switchToHttp().getRequest<Request>();
    if (!req) return true;

    const path = req.originalUrl || req.url || '';
    if (path.startsWith('/api/docs')) return true;

    const ip = normalizeIp(req.ip);
    if (!ip) return true;

    const now = Date.now();
    await this.assertIpNotBanned(ip);
    await this.assertRateLimit(ip, now);
    await this.assertMaliciousReferer(req.headers.referer, ip);
    return true;
  }

  private async assertRateLimit(ip: string, now: number) {
    const maxPerMinute = this.configService.get<number>('app.rateLimitPerMinute') ?? 180;
    const burstThreshold = this.configService.get<number>('app.ccBurstThreshold') ?? 80;
    const burstWindowSeconds = this.configService.get<number>('app.ccBurstWindowSeconds') ?? 10;
    const autoBanMinutes = this.configService.get<number>('app.ccAutoBanMinutes') ?? 10;
    const prefix = this.configService.get<string>('app.redisKeyPrefix') ?? 'enterprise_blog';

    const minuteKey = `m:${ip}:${Math.floor(now / 60000)}`;
    const redisMinute = await this.redisService.evalNumber(
      'local v = redis.call("INCR", KEYS[1]); if v == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]); end; return v;',
      [`${prefix}:rate:${minuteKey}`],
      [61],
    );
    if (redisMinute !== null) {
      if (redisMinute > maxPerMinute) {
        void this.securityService.recordSecurityEvent({
          type: 'RATE_LIMIT_HIT',
          ip,
          detail: `minute limit exceeded: ${redisMinute}/${maxPerMinute}`,
        });
        throw new HttpException('too many requests', HttpStatus.TOO_MANY_REQUESTS);
      }
    } else {
      const minute = this.counters.get(minuteKey);
      if (!minute || minute.expiresAt <= now) {
        this.counters.set(minuteKey, { count: 1, expiresAt: now + 61 * 1000 });
      } else {
        minute.count += 1;
        this.counters.set(minuteKey, minute);
        if (minute.count > maxPerMinute) {
          void this.securityService.recordSecurityEvent({
            type: 'RATE_LIMIT_HIT',
            ip,
            detail: `minute limit exceeded(memory): ${minute.count}/${maxPerMinute}`,
          });
          throw new HttpException('too many requests', HttpStatus.TOO_MANY_REQUESTS);
        }
      }
    }

    const burstKey = `b:${ip}`;
    const redisBurst = await this.redisService.evalNumber(
      'local v = redis.call("INCR", KEYS[1]); if v == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]); end; return v;',
      [`${prefix}:burst:${burstKey}`],
      [burstWindowSeconds],
    );
    if (redisBurst !== null) {
      if (redisBurst >= burstThreshold) {
        await this.autoBanIp(ip, autoBanMinutes, `cc burst detected: ${redisBurst}/${burstWindowSeconds}s`);
        void this.securityService.recordSecurityEvent({
          type: 'RATE_LIMIT_HIT',
          ip,
          detail: `burst limit exceeded: ${redisBurst}/${burstThreshold} in ${burstWindowSeconds}s`,
        });
        throw new HttpException('request blocked by cc protection', HttpStatus.TOO_MANY_REQUESTS);
      }
      return;
    }

    const burst = this.bursts.get(burstKey);
    if (!burst || burst.expiresAt <= now) {
      this.bursts.set(burstKey, {
        count: 1,
        expiresAt: now + burstWindowSeconds * 1000,
      });
      return;
    }
    burst.count += 1;
    this.bursts.set(burstKey, burst);
    if (burst.count >= burstThreshold) {
      await this.autoBanIp(ip, autoBanMinutes, `cc burst detected: ${burst.count}/${burstWindowSeconds}s`);
      void this.securityService.recordSecurityEvent({
        type: 'RATE_LIMIT_HIT',
        ip,
        detail: `burst limit exceeded(memory): ${burst.count}/${burstThreshold} in ${burstWindowSeconds}s`,
      });
      throw new HttpException('request blocked by cc protection', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async assertIpNotBanned(ip: string) {
    const now = new Date();
    const row = await this.prisma.bannedIp.findFirst({
      where: {
        ip,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true, reason: true },
    });
    if (!row) return;
    void this.securityService.recordSecurityEvent({
      type: 'IP_BAN_HIT',
      ip,
      detail: row.reason || 'ip banned by security policy',
    });
    throw new ForbiddenException(row.reason || 'ip banned by security policy');
  }

  private async autoBanIp(ip: string, minutes: number, reason: string) {
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    await this.prisma.bannedIp.upsert({
      where: { ip },
      update: {
        reason,
        expiresAt,
        deletedAt: null,
      },
      create: {
        ip,
        reason,
        expiresAt,
      },
    });
  }

  private async assertMaliciousReferer(referer: string | string[] | undefined, ip: string) {
    const raw = Array.isArray(referer) ? referer[0] : referer;
    const value = (raw ?? '').trim();
    if (!value) return;
    let hostname = '';
    try {
      hostname = new URL(value).hostname.toLowerCase();
    } catch {
      return;
    }
    if (!hostname) return;

    const row = await this.prisma.siteConfig.findUnique({
      where: { key: 'security.blocked_link_domains' },
      select: { value: true },
    });
    const domains = parseBlockedDomains(row?.value);
    if (!domains.some((item) => hostname === item || hostname.endsWith(`.${item}`))) {
      return;
    }

    const banMinutes = this.configService.get<number>('app.ccAutoBanMinutes') ?? 10;
    await this.autoBanIp(ip, banMinutes, `malicious referer blocked: ${hostname}`);
    void this.securityService.recordSecurityEvent({
      type: 'MALICIOUS_REFERRER_HIT',
      ip,
      detail: `referer=${hostname}`,
    });
    throw new ForbiddenException('malicious link source blocked');
  }
}

function normalizeIp(ip?: string) {
  const value = (ip ?? '').trim();
  if (!value) return '';
  if (value === '::1') return '127.0.0.1';
  if (value.startsWith('::ffff:')) return value.slice('::ffff:'.length);
  return value;
}

function parseBlockedDomains(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}
