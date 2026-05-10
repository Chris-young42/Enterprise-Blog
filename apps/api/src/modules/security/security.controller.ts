import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateIpBanDto } from './dto/create-ip-ban.dto';
import { CreateSecurityKeywordBanDto } from './dto/create-security-keyword-ban.dto';
import { SecurityService } from './security.service';
import { SecurityMonitorService } from './security-monitor.service';
import { GeoipService } from './geoip.service';
import { GeoipMaintenanceService } from './geoip-maintenance.service';

@Controller('security')
@Roles('SUPER_ADMIN', 'ADMIN')
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly securityMonitorService: SecurityMonitorService,
    private readonly geoipService: GeoipService,
    private readonly geoipMaintenanceService: GeoipMaintenanceService,
  ) {}

  @Get('ip-bans')
  listIpBans() {
    return this.securityService.listIpBans();
  }

  @Post('ip-bans')
  createIpBan(@Body() dto: CreateIpBanDto) {
    return this.securityService.createIpBan(dto);
  }

  @Delete('ip-bans/:id')
  removeIpBan(@Param('id') id: string) {
    return this.securityService.removeIpBan(id);
  }

  @Get('keyword-bans')
  listKeywordBans() {
    return this.securityService.listKeywordBans();
  }

  @Post('keyword-bans')
  createKeywordBan(@Body() dto: CreateSecurityKeywordBanDto) {
    return this.securityService.createKeywordBan(dto);
  }

  @Delete('keyword-bans/:id')
  removeKeywordBan(@Param('id') id: string) {
    return this.securityService.removeKeywordBan(id);
  }

  @Get('blocked-domains')
  listBlockedDomains() {
    return this.securityService.listBlockedDomains();
  }

  @Post('blocked-domains')
  addBlockedDomain(@Body() body: { domain?: string }) {
    return this.securityService.addBlockedDomain(body.domain ?? '');
  }

  @Delete('blocked-domains/:domain')
  removeBlockedDomain(@Param('domain') domain: string) {
    return this.securityService.removeBlockedDomain(domain);
  }

  @Get('redis/health')
  redisHealth() {
    return this.securityMonitorService.redisHealth();
  }

  @Get('redis/sla')
  redisSla(@Query('hours') hours?: string) {
    const parsed = hours ? Number(hours) : undefined;
    return this.securityMonitorService.redisSla(Number.isFinite(parsed) ? parsed : undefined);
  }

  @Get('redis/sla/trend')
  redisSlaTrend(@Query('days') days?: string) {
    const parsed = days ? Number(days) : undefined;
    return this.securityMonitorService.redisSlaTrend(Number.isFinite(parsed) ? parsed : undefined);
  }

  @Post('geoip/update')
  geoipUpdate() {
    return this.geoipMaintenanceService.runManual();
  }

  @Post('geoip/reload')
  geoipReload() {
    return this.geoipService.reload();
  }

  @Post('geoip/validate')
  geoipValidate(@Body() body: { samples?: Array<{ ip?: string; country?: string; city?: string }> }) {
    const samples = (body.samples ?? [])
      .map((item) => ({
        ip: item.ip ?? '',
        ...(item.country ? { country: item.country } : {}),
        ...(item.city ? { city: item.city } : {}),
      }))
      .filter((item) => item.ip.trim().length > 0);
    const result = this.geoipService.validateAccuracy(samples);
    return this.geoipService.saveValidationHistory(result);
  }

  @Get('geoip/status')
  geoipStatus() {
    return this.geoipMaintenanceService.getStatus();
  }

  @Get('geoip/validation-history')
  geoipValidationHistory() {
    return this.geoipService.getValidationHistory();
  }
}
