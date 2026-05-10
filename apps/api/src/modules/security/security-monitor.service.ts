import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from './redis.service';

@Injectable()
export class SecurityMonitorService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private degraded = false;
  private degradedStartedAt: Date | null = null;
  private lastDegradedAlertAt: Date | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const intervalSec = Math.max(15, this.configService.get<number>('app.redisHealthProbeIntervalSeconds') ?? 60);
    this.timer = setInterval(() => {
      void this.probeRedisHealth();
    }, intervalSec * 1000);
    await this.probeRedisHealth();
  }

  async onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async redisHealth() {
    const startedAt = Date.now();
    const pong = await this.redisService.ping();
    return {
      healthy: pong === 'PONG',
      pong,
      degraded: this.degraded,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
    };
  }

  async redisSla(hoursRaw?: number) {
    const now = new Date();
    const hours = normalizeHours(hoursRaw ?? this.configService.get<number>('app.redisSlaWindowHours') ?? 24);
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const events = await this.prisma.operationLog.findMany({
      where: {
        deletedAt: null,
        module: 'SECURITY',
        action: { in: ['REDIS_HEALTH_DEGRADED', 'REDIS_HEALTH_RECOVERED'] },
        createdAt: { gte: start, lte: now },
      },
      orderBy: [{ createdAt: 'asc' }],
      select: { action: true, createdAt: true, payload: true },
    });

    const incidents: Array<{
      startedAt: string;
      recoveredAt: string | null;
      durationMs: number;
    }> = [];
    let pointerStart = this.degradedStartedAt && this.degradedStartedAt > start ? this.degradedStartedAt : null;

    for (const event of events) {
      if (event.action === 'REDIS_HEALTH_DEGRADED') {
        pointerStart = event.createdAt;
      }
      if (event.action === 'REDIS_HEALTH_RECOVERED' && pointerStart) {
        const duration = Math.max(0, event.createdAt.getTime() - pointerStart.getTime());
        incidents.push({
          startedAt: pointerStart.toISOString(),
          recoveredAt: event.createdAt.toISOString(),
          durationMs: duration,
        });
        pointerStart = null;
      }
    }

    const unresolvedMs = pointerStart ? Math.max(0, now.getTime() - pointerStart.getTime()) : 0;
    if (pointerStart) {
      incidents.push({
        startedAt: pointerStart.toISOString(),
        recoveredAt: null,
        durationMs: unresolvedMs,
      });
    }

    const totalDowntimeMs = incidents.reduce((sum, item) => sum + item.durationMs, 0);
    const windowMs = now.getTime() - start.getTime();
    const availabilityPct =
      windowMs <= 0
        ? 100
        : Number((Math.max(0, 1 - totalDowntimeMs / windowMs) * 100).toFixed(4));

    return {
      window: {
        hours,
        start: start.toISOString(),
        end: now.toISOString(),
      },
      availabilityPct,
      totalDowntimeMs,
      incidentCount: incidents.length,
      activeIncident: this.degraded,
      incidents: incidents.slice(-50).reverse(),
    };
  }

  async redisSlaTrend(daysRaw?: number) {
    const days = normalizeDays(daysRaw ?? 30);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const buckets = buildDayBuckets(start, end);

    const probeMetrics = await this.readProbeMetrics();
    const recoveredEvents = await this.prisma.operationLog.findMany({
      where: {
        deletedAt: null,
        module: 'SECURITY',
        action: 'REDIS_RECOVERY_METRIC',
        createdAt: { gte: start, lte: end },
      },
      select: { createdAt: true, payload: true },
      orderBy: [{ createdAt: 'asc' }],
    });

    const mttrByDay = new Map<string, { totalMs: number; count: number }>();
    for (const event of recoveredEvents) {
      const day = toDayKey(event.createdAt);
      const durationMs = extractRecoveryDurationMs(event.payload);
      if (durationMs === null) continue;
      const current = mttrByDay.get(day) ?? { totalMs: 0, count: 0 };
      current.totalMs += durationMs;
      current.count += 1;
      mttrByDay.set(day, current);
    }

    const points = buckets.map((day) => {
      const metric = probeMetrics[day] ?? { total: 0, failed: 0 };
      const mttr = mttrByDay.get(day);
      return {
        bucket: day,
        probes: metric.total,
        failures: metric.failed,
        failureRatePct: metric.total > 0 ? Number(((metric.failed / metric.total) * 100).toFixed(2)) : 0,
        mttrMs: mttr && mttr.count > 0 ? Math.round(mttr.totalMs / mttr.count) : 0,
        recoveredCount: mttr?.count ?? 0,
      };
    });

    return {
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      points,
    };
  }

  private async probeRedisHealth() {
    const result = await this.redisHealth();
    await this.recordProbeMetric(result.healthy);
    if (result.healthy && this.degraded) {
      this.degraded = false;
      const recoveredAt = new Date();
      const degradedStartedAt = this.degradedStartedAt;
      const durationMs = degradedStartedAt ? Math.max(0, recoveredAt.getTime() - degradedStartedAt.getTime()) : null;
      this.degradedStartedAt = null;
      await this.writeSecurityLog('REDIS_HEALTH_RECOVERED', `redis health recovered, latency=${result.latencyMs}ms`);
      await this.prisma.operationLog.create({
        data: {
          module: 'SECURITY',
          action: 'REDIS_RECOVERY_METRIC',
          resourceId: 'redis',
          payload: {
            durationMs,
            recoveredAt: recoveredAt.toISOString(),
          },
        },
      });
      await this.notifySuperAdmins(
        '安全告警恢复',
        `Redis连接已恢复。latency=${result.latencyMs}ms${durationMs !== null ? `，故障持续${Math.round(durationMs / 1000)}秒` : ''}`,
      );
      return;
    }
    if (result.healthy) return;

    if (!this.degraded) {
      this.degraded = true;
      this.degradedStartedAt = new Date();
      this.lastDegradedAlertAt = new Date();
      await this.writeSecurityLog('REDIS_HEALTH_DEGRADED', 'redis probe failed, traffic shield fallback to memory counter');
      await this.notifySuperAdmins('安全告警', 'Redis健康探针失败，限流已回退到内存计数，请尽快排查。');
      return;
    }

    const throttleSeconds = Math.max(60, this.configService.get<number>('app.redisDegradedAlertThrottleSeconds') ?? 900);
    const now = new Date();
    if (!this.lastDegradedAlertAt || now.getTime() - this.lastDegradedAlertAt.getTime() >= throttleSeconds * 1000) {
      this.lastDegradedAlertAt = now;
      const downSeconds = this.degradedStartedAt ? Math.floor((now.getTime() - this.degradedStartedAt.getTime()) / 1000) : null;
      await this.writeSecurityLog(
        'REDIS_HEALTH_DEGRADED',
        `redis still degraded, fallback active, downSeconds=${downSeconds ?? -1}`,
      );
      await this.notifySuperAdmins(
        '安全告警持续',
        `Redis持续不可用${downSeconds !== null ? `（已持续${downSeconds}秒）` : ''}，限流仍处于内存回退模式。`,
      );
    }
  }

  private async notifySuperAdmins(title: string, content: string) {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        roles: {
          some: {
            deletedAt: null,
            role: { code: 'SUPER_ADMIN', deletedAt: null },
          },
        },
      },
      select: { id: true, email: true },
    });

    const emailEnabled = (this.configService.get<string>('app.securityProbeAlertEmailEnabled') ?? 'false') === 'true';
    await Promise.all(
      users.map((user) =>
        this.notificationsService.notifySecurityAlert({
          userId: user.id,
          recipientEmail: user.email,
          title,
          content,
          emailEnabled,
        }),
      ),
    );
  }

  private async writeSecurityLog(action: 'REDIS_HEALTH_DEGRADED' | 'REDIS_HEALTH_RECOVERED', detail: string) {
    await this.prisma.operationLog.create({
      data: {
        module: 'SECURITY',
        action,
        resourceId: 'redis',
        payload: {
          detail,
          at: new Date().toISOString(),
        },
      },
    });
  }

  private async recordProbeMetric(healthy: boolean) {
    const day = toDayKey(new Date());
    const key = 'security.redis_probe_metrics';
    const row = await this.prisma.siteConfig.findUnique({
      where: { key },
      select: { value: true },
    });
    const metrics = parseProbeMetrics(row?.value);
    const target = metrics[day] ?? { total: 0, failed: 0 };
    target.total += 1;
    if (!healthy) target.failed += 1;
    metrics[day] = target;
    const trimmed = trimProbeMetrics(metrics, 60);
    await this.prisma.siteConfig.upsert({
      where: { key },
      update: {
        value: trimmed,
        deletedAt: null,
        description: 'redis probe metrics by day',
      },
      create: {
        key,
        value: trimmed,
        description: 'redis probe metrics by day',
      },
    });
  }

  private async readProbeMetrics() {
    const row = await this.prisma.siteConfig.findUnique({
      where: { key: 'security.redis_probe_metrics' },
      select: { value: true },
    });
    return parseProbeMetrics(row?.value);
  }
}

function normalizeHours(value: number) {
  if (!Number.isFinite(value)) return 24;
  return Math.min(24 * 30, Math.max(1, Math.floor(value)));
}

function normalizeDays(value: number) {
  if (!Number.isFinite(value)) return 30;
  return Math.min(90, Math.max(1, Math.floor(value)));
}

function toDayKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDayBuckets(start: Date, end: Date) {
  const buckets: string[] = [];
  for (let cursor = new Date(start); cursor.getTime() <= end.getTime(); cursor.setDate(cursor.getDate() + 1)) {
    buckets.push(toDayKey(cursor));
  }
  return buckets;
}

function extractRecoveryDurationMs(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as Record<string, unknown>;
  const raw = value.durationMs;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

function parseProbeMetrics(raw: unknown) {
  if (!raw || typeof raw !== 'object') return {} as Record<string, { total: number; failed: number }>;
  const target: Record<string, { total: number; failed: number }> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    if (!value || typeof value !== 'object') continue;
    const item = value as Record<string, unknown>;
    const total = typeof item.total === 'number' ? item.total : 0;
    const failed = typeof item.failed === 'number' ? item.failed : 0;
    target[key] = {
      total: Math.max(0, Math.floor(total)),
      failed: Math.max(0, Math.floor(failed)),
    };
  }
  return target;
}

function trimProbeMetrics(input: Record<string, { total: number; failed: number }>, keepDays: number) {
  const keys = Object.keys(input).sort((a, b) => a.localeCompare(b));
  const keep = keys.slice(-keepDays);
  const output: Record<string, { total: number; failed: number }> = {};
  for (const key of keep) {
    const value = input[key];
    if (!value) continue;
    output[key] = value;
  }
  return output;
}
