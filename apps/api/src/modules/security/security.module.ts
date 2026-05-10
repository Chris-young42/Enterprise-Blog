import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { RedisService } from './redis.service';
import { GeoipService } from './geoip.service';
import { SecurityMonitorService } from './security-monitor.service';
import { GeoipMaintenanceService } from './geoip-maintenance.service';

@Module({
  imports: [ConfigModule, NotificationsModule],
  controllers: [SecurityController],
  providers: [SecurityService, RedisService, GeoipService, SecurityMonitorService, GeoipMaintenanceService],
  exports: [SecurityService, RedisService, GeoipService, SecurityMonitorService, GeoipMaintenanceService],
})
export class SecurityModule {}
