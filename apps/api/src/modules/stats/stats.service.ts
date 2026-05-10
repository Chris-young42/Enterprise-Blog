import { Injectable } from '@nestjs/common';
import { Prisma, type AccessLog, type LoginLog, type OperationLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Granularity = 'day' | 'week' | 'month';

export type TrafficQuery = {
  days?: string;
  from?: string;
  to?: string;
  granularity?: string;
};

export type LogQuery = {
  page?: string;
  pageSize?: string;
  days?: string;
  from?: string;
  to?: string;
  keyword?: string;
  method?: string;
  statusCode?: string;
  isSpider?: string;
  isSuccess?: string;
  module?: string;
  action?: string;
  ip?: string;
};

type ExportActor = {
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [
      articleTotal,
      publishedArticleTotal,
      userTotal,
      commentTotal,
      messageBoardTotal,
      friendLinkTotal,
      accessLogTotal,
      spiderVisitTotal,
    ] = await Promise.all([
      this.prisma.article.count({ where: { deletedAt: null } }),
      this.prisma.article.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.comment.count({ where: { deletedAt: null } }),
      this.prisma.messageBoard.count({ where: { deletedAt: null } }),
      this.prisma.friendLink.count({ where: { deletedAt: null } }),
      this.prisma.accessLog.count({ where: { deletedAt: null } }),
      this.prisma.accessLog.count({ where: { deletedAt: null, isSpider: true } }),
    ]);

    return {
      articleTotal,
      publishedArticleTotal,
      userTotal,
      commentTotal,
      messageBoardTotal,
      friendLinkTotal,
      accessLogTotal,
      spiderVisitTotal,
    };
  }

  async traffic(input: TrafficQuery) {
    const range = resolveRange(buildRangeQuery(input), 30);
    const previousRange = resolvePreviousRange(range.start, range.end);
    const granularity = normalizeGranularity(input.granularity);

    const [currentLogs, currentTotalVisits, previousTotalVisits] = await Promise.all([
      this.prisma.accessLog.findMany({
        where: { deletedAt: null, createdAt: { gte: range.start, lte: range.end } },
        select: { createdAt: true },
        orderBy: [{ createdAt: 'asc' }],
      }),
      this.prisma.accessLog.count({ where: { deletedAt: null, createdAt: { gte: range.start, lte: range.end } } }),
      this.prisma.accessLog.count({
        where: { deletedAt: null, createdAt: { gte: previousRange.start, lte: previousRange.end } },
      }),
    ]);

    const grouped = new Map<string, number>();
    for (const row of currentLogs) {
      const key = toBucketKey(row.createdAt, granularity);
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }

    const buckets = buildBuckets(range.start, range.end, granularity);
    const points = buckets.map((bucket) => ({
      bucket,
      visits: grouped.get(bucket) ?? 0,
    }));

    return {
      granularity,
      range: {
        start: range.start,
        end: range.end,
      },
      previousRange: {
        start: previousRange.start,
        end: previousRange.end,
      },
      totalVisits: currentTotalVisits,
      previousTotalVisits,
      changeRate: calculateRate(currentTotalVisits, previousTotalVisits),
      points,
    };
  }

  async contentRanking(limitRaw?: string) {
    const limit = normalizeLimit(limitRaw, 10);
    const [articles, tags, categories] = await Promise.all([
      this.prisma.article.findMany({
        where: { deletedAt: null, status: 'PUBLISHED' },
        select: { id: true, title: true, slug: true, views: true, likes: true, favorites: true },
        orderBy: [{ views: 'desc' }, { likes: 'desc' }, { favorites: 'desc' }],
        take: limit,
      }),
      this.prisma.articleTag.groupBy({
        by: ['tagId'],
        where: { deletedAt: null },
        _count: { tagId: true },
        orderBy: { _count: { tagId: 'desc' } },
        take: limit,
      }),
      this.prisma.article.groupBy({
        by: ['categoryId'],
        where: { deletedAt: null, categoryId: { not: null } },
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: limit,
      }),
    ]);

    const tagIds = tags.map((item) => item.tagId);
    const categoryIds = categories.map((item) => item.categoryId).filter((id): id is string => Boolean(id));

    const [tagRows, categoryRows] = await Promise.all([
      tagIds.length > 0
        ? this.prisma.tag.findMany({
            where: { id: { in: tagIds }, deletedAt: null },
            select: { id: true, name: true, slug: true },
          })
        : Promise.resolve([]),
      categoryIds.length > 0
        ? this.prisma.category.findMany({
            where: { id: { in: categoryIds }, deletedAt: null },
            select: { id: true, name: true, slug: true },
          })
        : Promise.resolve([]),
    ]);

    return {
      articleRanking: articles,
      tagRanking: tags.map((item) => {
        const tag = tagRows.find((row) => row.id === item.tagId);
        return {
          tagId: item.tagId,
          name: tag?.name ?? 'unknown',
          slug: tag?.slug ?? 'unknown',
          count: item._count.tagId,
        };
      }),
      categoryRanking: categories.map((item) => {
        const category = categoryRows.find((row) => row.id === item.categoryId);
        return {
          categoryId: item.categoryId,
          name: category?.name ?? 'unknown',
          slug: category?.slug ?? 'unknown',
          count: item._count.categoryId,
        };
      }),
    };
  }

  async visitorAnalysis(input: TrafficQuery) {
    const range = resolveRange(buildRangeQuery(input), 30);
    const rows = await this.prisma.accessLog.findMany({
      where: { deletedAt: null, createdAt: { gte: range.start, lte: range.end } },
      select: { region: true, deviceType: true, browser: true },
    });

    return {
      region: toTopCount(rows.map((item) => item.region), 10),
      deviceType: toTopCount(rows.map((item) => item.deviceType), 10),
      browser: toTopCount(rows.map((item) => item.browser), 10),
    };
  }

  async spiderAnalysis(input: TrafficQuery) {
    const range = resolveRange(buildRangeQuery(input), 30);
    const rows = await this.prisma.accessLog.findMany({
      where: { deletedAt: null, createdAt: { gte: range.start, lte: range.end }, isSpider: true },
      select: { spiderName: true, createdAt: true, path: true },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });

    return {
      bySpider: toTopCount(rows.map((item) => item.spiderName), 10),
      recent: rows.map((item) => ({
        spiderName: item.spiderName ?? 'unknown',
        path: item.path,
        createdAt: item.createdAt,
      })),
    };
  }

  async securityAnalysis(input: LogQuery) {
    const range = resolveRange(buildRangeQuery(input), 30);
    const where = this.buildSecurityWhere(input, range.start, range.end);
    const logs = await this.prisma.operationLog.findMany({
      where: {
        ...where,
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    const buckets = buildBuckets(range.start, range.end, 'day');
    const byAction = new Map<string, Map<string, number>>();
    const actions = ['IP_BAN_HIT', 'RATE_LIMIT_HIT', 'MALICIOUS_REFERRER_HIT', 'REDIS_HEALTH_DEGRADED', 'REDIS_HEALTH_RECOVERED'] as const;
    for (const action of actions) {
      byAction.set(action, new Map<string, number>());
    }

    for (const row of logs) {
      const bucket = toBucketKey(row.createdAt, 'day');
      const map = byAction.get(row.action);
      if (!map) continue;
      map.set(bucket, (map.get(bucket) ?? 0) + 1);
    }

    const ipSegmentMap = new Map<string, number>();
    for (const row of logs) {
      const ip = pickSecurityIp(row.ip, row.resourceId);
      if (!ip) continue;
      const segment = toIpSegment(ip);
      if (!segment) continue;
      ipSegmentMap.set(segment, (ipSegmentMap.get(segment) ?? 0) + 1);
    }

    return {
      range: { start: range.start, end: range.end },
      series: actions.map((action) => ({
        action,
        points: buckets.map((bucket) => ({
          bucket,
          count: byAction.get(action)?.get(bucket) ?? 0,
        })),
      })),
      totals: actions.map((action) => ({
        action,
        count: logs.filter((row) => row.action === action).length,
      })),
      recent: logs
        .slice(-100)
        .reverse()
        .map((row) => ({
          id: row.id,
          action: row.action,
          ip: row.ip,
          createdAt: row.createdAt,
          payload: row.payload,
        })),
      ipSegments: Array.from(ipSegmentMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([segment, count]) => ({ segment, count })),
    };
  }

  async exportSecurityAnalysis(input: LogQuery, actor?: ExportActor) {
    const range = resolveRange(buildRangeQuery(input), 30);
    const where = this.buildSecurityWhere(input, range.start, range.end);
    const rows = await this.prisma.operationLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: 5000,
    });
    const lines = rows.map((row) => [
      row.createdAt.toISOString(),
      row.action,
      row.ip ?? '',
      row.resourceId ?? '',
      JSON.stringify(row.payload ?? {}),
    ]);

    const filename = `security-events-${formatDatePart(new Date())}.csv`;
    const csv = toCsv(['createdAt', 'action', 'ip', 'resourceId', 'payload'], lines);

    await this.prisma.operationLog.create({
      data: {
        userId: actor?.userId ?? null,
        module: 'STATS',
        action: 'SECURITY_ANALYSIS_EXPORT',
        resourceId: filename,
        ip: actor?.ip ?? null,
        userAgent: actor?.userAgent ?? null,
        payload: {
          filters: {
            days: input.days ?? null,
            from: input.from ?? null,
            to: input.to ?? null,
            action: input.action ?? null,
            ip: input.ip ?? null,
          },
          count: rows.length,
        },
      },
    });

    return {
      filename,
      csv,
    };
  }

  async securityExportHistory(query: LogQuery) {
    const pagination = resolvePagination(query.page, query.pageSize);
    const range = resolveRange(buildRangeQuery(query), 30);
    const actorKeyword = query.keyword?.trim();
    const exportAction = query.action?.trim();
    const minCount = query.method?.trim() ? Number(query.method) : null;
    const maxCount = query.statusCode?.trim() ? Number(query.statusCode) : null;
    const [items, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where: {
          deletedAt: null,
          module: 'STATS',
          action: exportAction && exportAction.length > 0 ? exportAction : { in: ['SECURITY_ANALYSIS_EXPORT', 'SECURITY_EXPORT_HISTORY_EXPORT'] },
          createdAt: { gte: range.start, lte: range.end },
          ...(query.ip?.trim()
            ? {
                ip: { contains: query.ip.trim() },
              }
            : {}),
          ...(actorKeyword && actorKeyword.length > 0
            ? {
                OR: [
                  { user: { username: { contains: actorKeyword } } },
                  { user: { nickname: { contains: actorKeyword } } },
                ],
              }
            : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      this.prisma.operationLog.count({
        where: {
          deletedAt: null,
          module: 'STATS',
          action: exportAction && exportAction.length > 0 ? exportAction : { in: ['SECURITY_ANALYSIS_EXPORT', 'SECURITY_EXPORT_HISTORY_EXPORT'] },
          createdAt: { gte: range.start, lte: range.end },
          ...(query.ip?.trim()
            ? {
                ip: { contains: query.ip.trim() },
              }
            : {}),
          ...(actorKeyword && actorKeyword.length > 0
            ? {
                OR: [
                  { user: { username: { contains: actorKeyword } } },
                  { user: { nickname: { contains: actorKeyword } } },
                ],
              }
            : {}),
        },
      }),
    ]);

    const filtered = items.filter((item) => {
      const payload = item.payload as Record<string, unknown> | null;
      const countValue =
        payload &&
        typeof payload === 'object' &&
        typeof payload.count === 'number'
          ? payload.count
          : null;
      if (minCount !== null && Number.isFinite(minCount) && (countValue === null || countValue < minCount)) return false;
      if (maxCount !== null && Number.isFinite(maxCount) && (countValue === null || countValue > maxCount)) return false;
      return true;
    });

    return {
      items: filtered.map((item) => ({
        id: item.id,
        filename: item.resourceId ?? '',
        action: item.action,
        ip: item.ip,
        createdAt: item.createdAt,
        payload: item.payload,
        user: item.user,
      })),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }

  async exportSecurityExportHistory(query: LogQuery, actor?: ExportActor) {
    const range = resolveRange(buildRangeQuery(query), 30);
    const actorKeyword = query.keyword?.trim();
    const exportAction = query.action?.trim();
    const rows = await this.prisma.operationLog.findMany({
      where: {
        deletedAt: null,
        module: 'STATS',
        action: exportAction && exportAction.length > 0 ? exportAction : { in: ['SECURITY_ANALYSIS_EXPORT', 'SECURITY_EXPORT_HISTORY_EXPORT'] },
        createdAt: { gte: range.start, lte: range.end },
        ...(query.ip?.trim()
          ? {
              ip: { contains: query.ip.trim() },
            }
          : {}),
        ...(actorKeyword && actorKeyword.length > 0
          ? {
              OR: [
                { user: { username: { contains: actorKeyword } } },
                { user: { nickname: { contains: actorKeyword } } },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            username: true,
            nickname: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 5000,
    });

    const lines = rows.map((row) => [
      row.createdAt.toISOString(),
      row.resourceId ?? '',
      row.action,
      row.ip ?? '',
      row.user?.username ?? '',
      row.user?.nickname ?? '',
      JSON.stringify(row.payload ?? {}),
    ]);

    const filename = `security-export-history-${formatDatePart(new Date())}.csv`;
    const csv = toCsv(['createdAt', 'filename', 'action', 'ip', 'username', 'nickname', 'payload'], lines);

    await this.prisma.operationLog.create({
      data: {
        userId: actor?.userId ?? null,
        module: 'STATS',
        action: 'SECURITY_EXPORT_HISTORY_EXPORT',
        resourceId: filename,
        ip: actor?.ip ?? null,
        userAgent: actor?.userAgent ?? null,
        payload: {
          filters: {
            days: query.days ?? null,
            from: query.from ?? null,
            to: query.to ?? null,
          },
          count: rows.length,
        },
      },
    });

    return {
      filename,
      csv,
    };
  }

  async accessLogs(query: LogQuery) {
    const pagination = resolvePagination(query.page, query.pageSize);
    const where = this.buildAccessLogWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where,
        include: { user: { select: { id: true, username: true, nickname: true } } },
        orderBy: [{ createdAt: 'desc' }],
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    return {
      items: items.map(mapAccessLog),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }

  async exportAccessLogs(query: LogQuery) {
    const where = this.buildAccessLogWhere(query);
    const rows = await this.prisma.accessLog.findMany({
      where,
      include: { user: { select: { username: true, nickname: true } } },
      orderBy: [{ createdAt: 'desc' }],
      take: 2000,
    });

    const lines = rows.map((row) => [
      row.createdAt.toISOString(),
      row.path,
      row.method,
      row.statusCode,
      row.ip ?? '',
      row.region ?? '',
      row.browser ?? '',
      row.deviceType ?? '',
      row.isSpider ? 'true' : 'false',
      row.spiderName ?? '',
      row.user?.username ?? '',
      row.user?.nickname ?? '',
    ]);

    return {
      filename: `access-logs-${formatDatePart(new Date())}.csv`,
      csv: toCsv(
        ['createdAt', 'path', 'method', 'statusCode', 'ip', 'region', 'browser', 'deviceType', 'isSpider', 'spiderName', 'username', 'nickname'],
        lines,
      ),
    };
  }

  async loginLogs(query: LogQuery) {
    const pagination = resolvePagination(query.page, query.pageSize);
    const where = this.buildLoginLogWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.loginLog.findMany({
        where,
        include: { user: { select: { id: true, username: true, nickname: true } } },
        orderBy: [{ createdAt: 'desc' }],
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      this.prisma.loginLog.count({ where }),
    ]);

    return {
      items: items.map(mapLoginLog),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }

  async exportLoginLogs(query: LogQuery) {
    const where = this.buildLoginLogWhere(query);
    const rows = await this.prisma.loginLog.findMany({
      where,
      include: { user: { select: { username: true, nickname: true } } },
      orderBy: [{ createdAt: 'desc' }],
      take: 2000,
    });

    const lines = rows.map((row) => [
      row.createdAt.toISOString(),
      row.username ?? '',
      row.user?.nickname ?? '',
      row.ip,
      row.deviceType ?? '',
      row.location ?? '',
      row.isSuccess ? 'true' : 'false',
      row.reason ?? '',
    ]);

    return {
      filename: `login-logs-${formatDatePart(new Date())}.csv`,
      csv: toCsv(['createdAt', 'username', 'nickname', 'ip', 'deviceType', 'location', 'isSuccess', 'reason'], lines),
    };
  }

  async operationLogs(query: LogQuery) {
    const pagination = resolvePagination(query.page, query.pageSize);
    const where = this.buildOperationLogWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        include: { user: { select: { id: true, username: true, nickname: true } } },
        orderBy: [{ createdAt: 'desc' }],
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      items: items.map(mapOperationLog),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }

  async exportOperationLogs(query: LogQuery) {
    const where = this.buildOperationLogWhere(query);
    const rows = await this.prisma.operationLog.findMany({
      where,
      include: { user: { select: { username: true, nickname: true } } },
      orderBy: [{ createdAt: 'desc' }],
      take: 2000,
    });

    const lines = rows.map((row) => [
      row.createdAt.toISOString(),
      row.module,
      row.action,
      row.resourceId ?? '',
      row.ip ?? '',
      row.user?.username ?? '',
      row.user?.nickname ?? '',
    ]);

    return {
      filename: `operation-logs-${formatDatePart(new Date())}.csv`,
      csv: toCsv(['createdAt', 'module', 'action', 'resourceId', 'ip', 'username', 'nickname'], lines),
    };
  }

  private buildAccessLogWhere(query: LogQuery): Prisma.AccessLogWhereInput {
    const range = resolveRange(buildRangeQuery(query), 30);
    const where: Prisma.AccessLogWhereInput = {
      deletedAt: null,
      createdAt: { gte: range.start, lte: range.end },
    };

    const keyword = query.keyword?.trim();
    if (keyword && keyword.length > 0) {
      where.OR = [
        { path: { contains: keyword } },
        { ip: { contains: keyword } },
        { userAgent: { contains: keyword } },
        { spiderName: { contains: keyword } },
      ];
    }

    const method = query.method?.trim();
    if (method && method.length > 0) {
      where.method = method.toUpperCase();
    }

    const statusCode = parseOptionalNumber(query.statusCode);
    if (statusCode !== null) {
      where.statusCode = statusCode;
    }

    const isSpider = parseOptionalBoolean(query.isSpider);
    if (isSpider !== null) {
      where.isSpider = isSpider;
    }

    return where;
  }

  private buildLoginLogWhere(query: LogQuery): Prisma.LoginLogWhereInput {
    const range = resolveRange(buildRangeQuery(query), 30);
    const where: Prisma.LoginLogWhereInput = {
      deletedAt: null,
      createdAt: { gte: range.start, lte: range.end },
    };

    const keyword = query.keyword?.trim();
    if (keyword && keyword.length > 0) {
      where.OR = [
        { username: { contains: keyword } },
        { ip: { contains: keyword } },
        { userAgent: { contains: keyword } },
      ];
    }

    const isSuccess = parseOptionalBoolean(query.isSuccess);
    if (isSuccess !== null) {
      where.isSuccess = isSuccess;
    }

    return where;
  }

  private buildOperationLogWhere(query: LogQuery): Prisma.OperationLogWhereInput {
    const range = resolveRange(buildRangeQuery(query), 30);
    const where: Prisma.OperationLogWhereInput = {
      deletedAt: null,
      createdAt: { gte: range.start, lte: range.end },
    };

    const keyword = query.keyword?.trim();
    if (keyword && keyword.length > 0) {
      where.OR = [
        { module: { contains: keyword } },
        { action: { contains: keyword } },
        { resourceId: { contains: keyword } },
      ];
    }

    const moduleName = query.module?.trim();
    if (moduleName && moduleName.length > 0) {
      where.module = { contains: moduleName };
    }

    const actionName = query.action?.trim();
    if (actionName && actionName.length > 0) {
      where.action = { contains: actionName };
    }

    return where;
  }

  private buildSecurityWhere(query: LogQuery, start: Date, end: Date): Prisma.OperationLogWhereInput {
    const where: Prisma.OperationLogWhereInput = {
      deletedAt: null,
      module: 'SECURITY',
      createdAt: { gte: start, lte: end },
    };

    const action = query.action?.trim();
    if (action && action.length > 0) {
      where.action = action;
    }

    const ip = query.ip?.trim();
    if (ip && ip.length > 0) {
      where.OR = [{ ip: { contains: ip } }, { resourceId: { contains: ip } }];
    }

    return where;
  }
}

function normalizeDays(input: string | undefined, fallback: number) {
  const parsed = Number(input ?? fallback);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(365, Math.max(1, parsed));
}

function normalizeLimit(input: string | undefined, fallback: number) {
  const parsed = Number(input ?? fallback);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(50, Math.max(1, parsed));
}

function resolvePagination(pageRaw?: string, pageSizeRaw?: string) {
  const pageParsed = Number(pageRaw ?? 1);
  const pageSizeParsed = Number(pageSizeRaw ?? 20);
  return {
    page: Number.isNaN(pageParsed) ? 1 : Math.max(1, pageParsed),
    pageSize: Number.isNaN(pageSizeParsed) ? 20 : Math.min(100, Math.max(1, pageSizeParsed)),
  };
}

function resolveRange(input: { days?: string; from?: string; to?: string }, fallbackDays: number) {
  const fromParsed = input.from ? new Date(input.from) : null;
  const toParsed = input.to ? new Date(input.to) : null;
  if (fromParsed && toParsed && !Number.isNaN(fromParsed.getTime()) && !Number.isNaN(toParsed.getTime())) {
    const start = startOfDay(fromParsed);
    const end = endOfDay(toParsed);
    if (start.getTime() <= end.getTime()) {
      return { start, end };
    }
  }

  const days = normalizeDays(input.days, fallbackDays);
  const now = new Date();
  const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)));
  const end = endOfDay(now);
  return { start, end };
}

function resolvePreviousRange(start: Date, end: Date) {
  const span = end.getTime() - start.getTime() + 1;
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - span + 1);
  return {
    start: previousStart,
    end: previousEnd,
  };
}

function normalizeGranularity(input?: string): Granularity {
  if (input === 'week') return 'week';
  if (input === 'month') return 'month';
  return 'day';
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(date, diff));
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function toDayKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toWeekKey(value: Date) {
  const weekStart = startOfWeek(value);
  return toDayKey(weekStart);
}

function toMonthKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function toBucketKey(value: Date, granularity: Granularity) {
  if (granularity === 'week') return toWeekKey(value);
  if (granularity === 'month') return toMonthKey(value);
  return toDayKey(value);
}

function buildBuckets(start: Date, end: Date, granularity: Granularity) {
  const buckets: string[] = [];
  if (granularity === 'day') {
    for (let cursor = startOfDay(start); cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1)) {
      buckets.push(toDayKey(cursor));
    }
    return buckets;
  }

  if (granularity === 'week') {
    for (let cursor = startOfWeek(start); cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 7)) {
      buckets.push(toWeekKey(cursor));
    }
    return buckets;
  }

  for (let cursor = startOfMonth(start); cursor.getTime() <= end.getTime();) {
    buckets.push(toMonthKey(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return buckets;
}

function toTopCount(values: Array<string | null | undefined>, take: number) {
  const map = new Map<string, number>();
  for (const value of values) {
    const key = value && value.trim().length > 0 ? value : 'unknown';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([name, count]) => ({ name, count }));
}

function calculateRate(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function parseOptionalBoolean(input?: string) {
  if (!input) return null;
  if (input === 'true' || input === '1') return true;
  if (input === 'false' || input === '0') return false;
  return null;
}

function parseOptionalNumber(input?: string) {
  if (!input) return null;
  const parsed = Number(input);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function buildRangeQuery(input: { days?: string; from?: string; to?: string }) {
  return {
    ...(input.days ? { days: input.days } : {}),
    ...(input.from ? { from: input.from } : {}),
    ...(input.to ? { to: input.to } : {}),
  };
}

function pickSecurityIp(ip: string | null, resourceId: string | null) {
  if (ip && ip.trim().length > 0) return ip.trim();
  if (resourceId && isIpLike(resourceId)) return resourceId.trim();
  return null;
}

function isIpLike(value: string) {
  const input = value.trim();
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(input) || /^[a-fA-F0-9:]+$/.test(input);
}

function toIpSegment(ip: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
  }
  if (ip.includes(':')) {
    const parts = ip.split(':').filter((item) => item.length > 0);
    if (parts.length >= 4) {
      return `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}::*`;
    }
    return `${ip}::*`;
  }
  return null;
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? '');
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toCsv(headers: string[], rows: unknown[][]) {
  const headerLine = headers.map((item) => escapeCsvValue(item)).join(',');
  const bodyLines = rows.map((row) => row.map((item) => escapeCsvValue(item)).join(','));
  return `\uFEFF${[headerLine, ...bodyLines].join('\n')}`;
}

function formatDatePart(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}-${hour}${minute}`;
}

function mapAccessLog(row: AccessLog & { user: { id: string; username: string; nickname: string | null } | null }) {
  return {
    id: row.id,
    path: row.path,
    method: row.method,
    statusCode: row.statusCode,
    ip: row.ip,
    userAgent: row.userAgent,
    responseMs: row.responseMs,
    region: row.region,
    browser: row.browser,
    deviceType: row.deviceType,
    isSpider: row.isSpider,
    spiderName: row.spiderName,
    createdAt: row.createdAt,
    user: row.user,
  };
}

function mapLoginLog(row: LoginLog & { user: { id: string; username: string; nickname: string | null } | null }) {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    ip: row.ip,
    userAgent: row.userAgent,
    deviceType: row.deviceType,
    location: row.location,
    isSuccess: row.isSuccess,
    reason: row.reason,
    createdAt: row.createdAt,
    user: row.user,
  };
}

function mapOperationLog(row: OperationLog & { user: { id: string; username: string; nickname: string | null } | null }) {
  return {
    id: row.id,
    module: row.module,
    action: row.action,
    resourceId: row.resourceId,
    ip: row.ip,
    userAgent: row.userAgent,
    payload: row.payload,
    createdAt: row.createdAt,
    user: row.user,
  };
}
