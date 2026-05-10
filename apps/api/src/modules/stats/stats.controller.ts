import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { StatsService, type LogQuery, type TrafficQuery } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  overview() {
    return this.statsService.overview();
  }

  @Get('traffic')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  traffic(
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: string,
  ) {
    return this.statsService.traffic(buildTrafficQuery(days, from, to, granularity));
  }

  @Get('content-ranking')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  contentRanking(@Query('limit') limit?: string) {
    return this.statsService.contentRanking(limit);
  }

  @Get('visitor-analysis')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  visitorAnalysis(@Query('days') days?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.statsService.visitorAnalysis(buildRangeQuery(days, from, to));
  }

  @Get('spider-analysis')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  spiderAnalysis(@Query('days') days?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.statsService.spiderAnalysis(buildRangeQuery(days, from, to));
  }

  @Get('security-analysis')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  securityAnalysis(
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('action') action?: string,
    @Query('ip') ip?: string,
  ) {
    return this.statsService.securityAnalysis(buildLogQuery({ days, from, to, action, ip }));
  }

  @Get('security-analysis/export')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async exportSecurityAnalysis(
    @CurrentUser() user: AuthenticatedUser | null,
    @Res() res: Response,
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('action') action?: string,
    @Query('ip') ip?: string,
  ) {
    const result = await this.statsService.exportSecurityAnalysis(buildLogQuery({ days, from, to, action, ip }), {
      userId: user?.sub ?? null,
      ip: null,
      userAgent: null,
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  }

  @Get('security-analysis/export-history')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  securityExportHistory(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('keyword') keyword?: string,
    @Query('action') action?: string,
    @Query('ip') ip?: string,
    @Query('minCount') minCount?: string,
    @Query('maxCount') maxCount?: string,
  ) {
    return this.statsService.securityExportHistory(
      buildLogQuery({
        page,
        pageSize,
        days,
        from,
        to,
        keyword,
        action,
        ip,
        method: minCount,
        statusCode: maxCount,
      }),
    );
  }

  @Get('security-analysis/export-history/export')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async exportSecurityExportHistory(
    @CurrentUser() user: AuthenticatedUser | null,
    @Res() res: Response,
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('keyword') keyword?: string,
    @Query('action') action?: string,
    @Query('ip') ip?: string,
    @Query('minCount') minCount?: string,
    @Query('maxCount') maxCount?: string,
  ) {
    const result = await this.statsService.exportSecurityExportHistory(
      buildLogQuery({
        days,
        from,
        to,
        keyword,
        action,
        ip,
        method: minCount,
        statusCode: maxCount,
      }),
      {
      userId: user?.sub ?? null,
      ip: null,
      userAgent: null,
      },
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  }

  @Get('logs/access')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  accessLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('keyword') keyword?: string,
    @Query('method') method?: string,
    @Query('statusCode') statusCode?: string,
    @Query('isSpider') isSpider?: string,
  ) {
    return this.statsService.accessLogs(buildLogQuery({ page, pageSize, days, from, to, keyword, method, statusCode, isSpider }));
  }

  @Get('logs/access/export')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async exportAccessLogs(
    @Res() res: Response,
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('keyword') keyword?: string,
    @Query('method') method?: string,
    @Query('statusCode') statusCode?: string,
    @Query('isSpider') isSpider?: string,
  ) {
    const result = await this.statsService.exportAccessLogs(
      buildLogQuery({ days, from, to, keyword, method, statusCode, isSpider }),
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  }

  @Get('logs/login')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  loginLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('keyword') keyword?: string,
    @Query('isSuccess') isSuccess?: string,
  ) {
    return this.statsService.loginLogs(buildLogQuery({ page, pageSize, days, from, to, keyword, isSuccess }));
  }

  @Get('logs/login/export')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async exportLoginLogs(
    @Res() res: Response,
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('keyword') keyword?: string,
    @Query('isSuccess') isSuccess?: string,
  ) {
    const result = await this.statsService.exportLoginLogs(buildLogQuery({ days, from, to, keyword, isSuccess }));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  }

  @Get('logs/operation')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  operationLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('keyword') keyword?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
  ) {
    return this.statsService.operationLogs(buildLogQuery({ page, pageSize, days, from, to, keyword, module, action }));
  }

  @Get('logs/operation/export')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async exportOperationLogs(
    @Res() res: Response,
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('keyword') keyword?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
  ) {
    const result = await this.statsService.exportOperationLogs(buildLogQuery({ days, from, to, keyword, module, action }));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  }
}

function buildRangeQuery(days?: string, from?: string, to?: string): TrafficQuery {
  return {
    ...(days ? { days } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

function buildTrafficQuery(days?: string, from?: string, to?: string, granularity?: string): TrafficQuery {
  return {
    ...buildRangeQuery(days, from, to),
    ...(granularity ? { granularity } : {}),
  };
}

function buildLogQuery(input: {
  page?: string | undefined;
  pageSize?: string | undefined;
  days?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  keyword?: string | undefined;
  method?: string | undefined;
  statusCode?: string | undefined;
  isSpider?: string | undefined;
  isSuccess?: string | undefined;
  module?: string | undefined;
  action?: string | undefined;
  ip?: string | undefined;
}): LogQuery {
  return {
    ...(input.page ? { page: input.page } : {}),
    ...(input.pageSize ? { pageSize: input.pageSize } : {}),
    ...(input.days ? { days: input.days } : {}),
    ...(input.from ? { from: input.from } : {}),
    ...(input.to ? { to: input.to } : {}),
    ...(input.keyword ? { keyword: input.keyword } : {}),
    ...(input.method ? { method: input.method } : {}),
    ...(input.statusCode ? { statusCode: input.statusCode } : {}),
    ...(input.isSpider ? { isSpider: input.isSpider } : {}),
    ...(input.isSuccess ? { isSuccess: input.isSuccess } : {}),
    ...(input.module ? { module: input.module } : {}),
    ...(input.action ? { action: input.action } : {}),
    ...(input.ip ? { ip: input.ip } : {}),
  };
}
