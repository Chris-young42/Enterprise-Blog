import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MomentsService } from './moments.service';
import { ListMomentsDto } from './dto/list-moments.dto';
import { CreateMomentDto } from './dto/create-moment.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';

type AuthRequest = {
  user?: {
    sub: string;
    roleCodes: string[];
  };
};

@Controller('moments')
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  @Public()
  @Get()
  list(@Req() req: AuthRequest, @Query() query: ListMomentsDto) {
    return this.momentsService.list(query, isAdmin(req.user?.roleCodes));
  }

  @Public()
  @Get('timeline')
  timeline() {
    return this.momentsService.timeline();
  }

  @Public()
  @Get(':slug')
  detail(@Req() req: AuthRequest, @Param('slug') slug: string) {
    return this.momentsService.detail(slug, isAdmin(req.user?.roleCodes));
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  create(@Req() req: AuthRequest, @Body() dto: CreateMomentDto) {
    if (!req.user) return null;
    return this.momentsService.create(req.user, dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  update(@Param('id') id: string, @Body() dto: UpdateMomentDto) {
    return this.momentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  remove(@Param('id') id: string) {
    return this.momentsService.remove(id);
  }
}

function isAdmin(roles?: string[]) {
  return (roles ?? []).some((role) => ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(role));
}
