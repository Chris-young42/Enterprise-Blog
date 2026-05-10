import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  listMine(
    @CurrentUser() user: AuthenticatedUser | null,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    if (!user) return { items: [], total: 0, page: 1, pageSize: 20 };
    return this.notificationsService.myList(user.sub, page, pageSize, unreadOnly);
  }

  @Patch('me/read')
  markRead(@CurrentUser() user: AuthenticatedUser | null, @Body() body: { id?: string }) {
    if (!user || !body.id) return { id: body.id ?? '' };
    return this.notificationsService.markRead(user.sub, body.id);
  }

  @Patch('me/read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) return { affected: 0 };
    return this.notificationsService.markAllRead(user.sub);
  }

  @Get('admin/list')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  adminList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('channel') channel?: string,
  ) {
    return this.notificationsService.adminList(page, pageSize, channel);
  }

  @Get('admin/email-logs')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  adminEmailLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('recipient') recipient?: string,
  ) {
    return this.notificationsService.adminEmailLogs(page, pageSize, status, recipient);
  }
}
