import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GeoipService } from './geoip.service';

type GeoipUpdateState = {
  running: boolean;
  lastStatus: 'IDLE' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  lastTrigger: 'MANUAL' | 'AUTO' | null;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastDurationMs: number | null;
  lastOutputPreview: string | null;
  nextRunAt: string | null;
};

type TriggerType = 'MANUAL' | 'AUTO';

@Injectable()
export class GeoipMaintenanceService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly geoipService: GeoipService,
  ) {}

  async onModuleInit() {
    const intervalHours = this.resolveIntervalHours();
    this.timer = setInterval(() => {
      void this.safeRun('AUTO');
    }, intervalHours * 60 * 60 * 1000);

    await this.ensureStateSeeded();
    await this.refreshNextRunAt();
  }

  async onModuleDestroy() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  async getStatus() {
    const state = await this.readState();
    const licenseConfigured = ((this.configService.get<string>('app.geoipLicenseKey') ?? '').trim().length > 0);
    return {
      ...state,
      intervalHours: this.resolveIntervalHours(),
      licenseConfigured,
      statusHint: licenseConfigured ? null : 'GEOIP_LICENSE_KEY is not configured',
    };
  }

  async runManual() {
    return this.safeRun('MANUAL');
  }

  private async safeRun(trigger: TriggerType) {
    if (this.running) {
      const state = await this.readState();
      return {
        success: false,
        message: 'geoip update is already running',
        output: '',
        state,
      };
    }
    this.running = true;
    const startedAt = new Date();
    await this.updateState({
      running: true,
      lastTrigger: trigger,
      lastStartedAt: startedAt.toISOString(),
      lastError: null,
    });

    try {
      const result = await this.geoipService.updateDatabase();
      if (!result.success) {
        if (result.message === 'GEOIP_LICENSE_KEY is required') {
          const skippedState = await this.onFinished(trigger, startedAt, 'SKIPPED', result.message, result.output);
          await this.prisma.operationLog.create({
            data: {
              module: 'SECURITY',
              action: trigger === 'AUTO' ? 'GEOIP_AUTO_UPDATE_SKIPPED' : 'GEOIP_MANUAL_UPDATE_SKIPPED',
              resourceId: 'geoip',
              payload: {
                startedAt: startedAt.toISOString(),
                finishedAt: new Date().toISOString(),
                reason: result.message,
              },
            },
          });
          return {
            ...result,
            state: skippedState,
          };
        }
        const failedState = await this.onFinished(trigger, startedAt, 'FAILED', result.message, result.output);
        return {
          ...result,
          state: failedState,
        };
      }
      const successState = await this.onFinished(trigger, startedAt, 'SUCCESS', null, result.output);
      await this.prisma.operationLog.create({
        data: {
          module: 'SECURITY',
          action: trigger === 'AUTO' ? 'GEOIP_AUTO_UPDATE_SUCCESS' : 'GEOIP_MANUAL_UPDATE_SUCCESS',
          resourceId: 'geoip',
          payload: {
            startedAt: startedAt.toISOString(),
            finishedAt: new Date().toISOString(),
            durationMs: successState.lastDurationMs,
          },
        },
      });
      return {
        ...result,
        state: successState,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failedState = await this.onFinished(trigger, startedAt, 'FAILED', message, '');
      await this.prisma.operationLog.create({
        data: {
          module: 'SECURITY',
          action: trigger === 'AUTO' ? 'GEOIP_AUTO_UPDATE_FAILED' : 'GEOIP_MANUAL_UPDATE_FAILED',
          resourceId: 'geoip',
          payload: {
            startedAt: startedAt.toISOString(),
            finishedAt: new Date().toISOString(),
            error: message,
          },
        },
      });
      return {
        success: false,
        message,
        output: '',
        state: failedState,
      };
    } finally {
      this.running = false;
    }
  }

  private async onFinished(
    trigger: TriggerType,
    startedAt: Date,
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED',
    error: string | null,
    output: string,
  ) {
    const finishedAt = new Date();
    const nextRunAt = new Date(finishedAt.getTime() + this.resolveIntervalHours() * 60 * 60 * 1000).toISOString();
    const payload: Partial<GeoipUpdateState> = {
      running: false,
      lastStatus: status,
      lastFinishedAt: finishedAt.toISOString(),
      lastDurationMs: finishedAt.getTime() - startedAt.getTime(),
      lastError: error,
      lastOutputPreview: output ? output.slice(0, 2000) : null,
      nextRunAt,
      lastTrigger: trigger,
    };
    if (status === 'SUCCESS') {
      payload.lastSuccessAt = finishedAt.toISOString();
    }
    return this.updateState(payload);
  }

  private resolveIntervalHours() {
    const raw = this.configService.get<number>('app.geoipAutoUpdateIntervalHours') ?? 24;
    if (!Number.isFinite(raw)) return 24;
    return Math.max(1, Math.floor(raw));
  }

  private async ensureStateSeeded() {
    const existing = await this.prisma.siteConfig.findUnique({
      where: { key: 'security.geoip_update_state' },
      select: { id: true },
    });
    if (existing) return;
    await this.prisma.siteConfig.create({
      data: {
        key: 'security.geoip_update_state',
        description: 'geoip auto update state',
        value: defaultState(),
      },
    });
  }

  private async refreshNextRunAt() {
    const state = await this.readState();
    const next = state.lastFinishedAt
      ? new Date(new Date(state.lastFinishedAt).getTime() + this.resolveIntervalHours() * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + this.resolveIntervalHours() * 60 * 60 * 1000).toISOString();
    await this.updateState({ nextRunAt: next });
  }

  private async readState(): Promise<GeoipUpdateState> {
    const row = await this.prisma.siteConfig.findUnique({
      where: { key: 'security.geoip_update_state' },
      select: { value: true },
    });
    return parseState(row?.value);
  }

  private async updateState(patch: Partial<GeoipUpdateState>) {
    const current = await this.readState();
    const next = {
      ...current,
      ...patch,
    };
    await this.prisma.siteConfig.upsert({
      where: { key: 'security.geoip_update_state' },
      update: {
        value: next,
        deletedAt: null,
        description: 'geoip auto update state',
      },
      create: {
        key: 'security.geoip_update_state',
        value: next,
        description: 'geoip auto update state',
      },
    });
    return next;
  }
}

function defaultState(): GeoipUpdateState {
  return {
    running: false,
    lastStatus: 'IDLE',
    lastTrigger: null,
    lastStartedAt: null,
    lastFinishedAt: null,
    lastSuccessAt: null,
    lastError: null,
    lastDurationMs: null,
    lastOutputPreview: null,
    nextRunAt: null,
  };
}

function parseState(raw: unknown): GeoipUpdateState {
  if (!raw || typeof raw !== 'object') return defaultState();
  const value = raw as Record<string, unknown>;
  return {
    running: value.running === true,
    lastStatus:
      value.lastStatus === 'SUCCESS' ||
      value.lastStatus === 'FAILED' ||
      value.lastStatus === 'SKIPPED' ||
      value.lastStatus === 'IDLE'
        ? value.lastStatus
        : 'IDLE',
    lastTrigger: value.lastTrigger === 'AUTO' || value.lastTrigger === 'MANUAL' ? value.lastTrigger : null,
    lastStartedAt: typeof value.lastStartedAt === 'string' ? value.lastStartedAt : null,
    lastFinishedAt: typeof value.lastFinishedAt === 'string' ? value.lastFinishedAt : null,
    lastSuccessAt: typeof value.lastSuccessAt === 'string' ? value.lastSuccessAt : null,
    lastError: typeof value.lastError === 'string' ? value.lastError : null,
    lastDurationMs: typeof value.lastDurationMs === 'number' ? value.lastDurationMs : null,
    lastOutputPreview: typeof value.lastOutputPreview === 'string' ? value.lastOutputPreview : null,
    nextRunAt: typeof value.nextRunAt === 'string' ? value.nextRunAt : null,
  };
}
