import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Public()
  @Get()
  listPublic() {
    return this.announcementsService.listPublic();
  }

  @Get('admin/list')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  listAdmin() {
    return this.announcementsService.listAdmin();
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  create(@Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
