import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OpsService } from './ops.service';
import { UpdateSiteProfileDto } from './dto/site-profile.dto';
import { MigrateTaskDto, RestorePrecheckDto, RestoreTaskDto } from './dto/task.dto';

@Controller('ops')
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Post('cache/clear')
  @Roles('SUPER_ADMIN', 'ADMIN')
  clearCache() {
    return this.opsService.clearCache();
  }

  @Post('static/generate')
  @Roles('SUPER_ADMIN', 'ADMIN')
  generateStatic() {
    return this.opsService.generateStatic();
  }

  @Get('static/tasks')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  listStaticTasks(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.opsService.listStaticTasks(page, pageSize);
  }

  @Get('static/artifacts')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  listStaticArtifacts() {
    return this.opsService.listStaticArtifacts();
  }

  @Post('backup')
  @Roles('SUPER_ADMIN', 'ADMIN')
  backup(@CurrentUser() user: AuthenticatedUser | null) {
    return this.opsService.backup({
      userId: user?.sub ?? null,
      ip: null,
      userAgent: null,
      roleCodes: user?.roleCodes ?? [],
    });
  }

  @Post('restore')
  @Roles('SUPER_ADMIN', 'ADMIN')
  restore(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() body: RestoreTaskDto,
  ) {
    const payload = {
      restoreFrom: body.restoreFrom,
      ...(body.confirmToken ? { confirmToken: body.confirmToken } : {}),
      ...(body.dryRun !== undefined ? { dryRun: body.dryRun } : {}),
      ...(body.confirmPhrase ? { confirmPhrase: body.confirmPhrase } : {}),
      ...(body.approvalReason ? { approvalReason: body.approvalReason } : {}),
    };
    return this.opsService.restore(
      payload,
      {
        userId: user?.sub ?? null,
        ip: null,
        userAgent: null,
        roleCodes: user?.roleCodes ?? [],
      },
    );
  }

  @Post('restore/precheck')
  @Roles('SUPER_ADMIN', 'ADMIN')
  restorePrecheck(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() body: RestorePrecheckDto,
  ) {
    return this.opsService.restorePrecheck(body.restoreFrom, {
      userId: user?.sub ?? null,
      ip: null,
      userAgent: null,
      roleCodes: user?.roleCodes ?? [],
    });
  }

  @Post('migrate')
  @Roles('SUPER_ADMIN', 'ADMIN')
  migrate(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() body: MigrateTaskDto,
  ) {
    const payload = {
      ...(body.target ? { target: body.target } : {}),
      ...(body.confirmToken ? { confirmToken: body.confirmToken } : {}),
      ...(body.dryRun !== undefined ? { dryRun: body.dryRun } : {}),
      ...(body.confirmPhrase ? { confirmPhrase: body.confirmPhrase } : {}),
      ...(body.approvalReason ? { approvalReason: body.approvalReason } : {}),
    };
    return this.opsService.migrate(
      payload,
      {
        userId: user?.sub ?? null,
        ip: null,
        userAgent: null,
        roleCodes: user?.roleCodes ?? [],
      },
    );
  }

  @Post('migrate/precheck')
  @Roles('SUPER_ADMIN', 'ADMIN')
  migratePrecheck(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() body: MigrateTaskDto,
  ) {
    return this.opsService.migratePrecheck(body.target, {
      userId: user?.sub ?? null,
      ip: null,
      userAgent: null,
      roleCodes: user?.roleCodes ?? [],
    });
  }

  @Get('backup/tasks')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  backupTasks(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.opsService.listBackupTasks(page, pageSize, type, status);
  }

  @Get('approval-records')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  approvalRecords(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.opsService.listApprovalRecords(page, pageSize);
  }

  @Public()
  @Get('site/profile')
  getSiteProfile() {
    return this.opsService.getSiteProfile();
  }

  @Patch('site/profile')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  updateSiteProfile(@Body() dto: UpdateSiteProfileDto) {
    return this.opsService.updateSiteProfile(dto);
  }
}
