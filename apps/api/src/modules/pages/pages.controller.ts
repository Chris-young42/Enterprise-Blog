import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { ListPagesDto } from './dto/list-pages.dto';

type AuthRequest = {
  user?: {
    roleCodes: string[];
  };
};

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Public()
  @Get()
  list(@Req() req: AuthRequest, @Query() query: ListPagesDto) {
    return this.pagesService.list(query, isAdmin(req.user?.roleCodes));
  }

  @Public()
  @Get(':slug')
  detail(@Req() req: AuthRequest, @Param('slug') slug: string) {
    return this.pagesService.detail(slug, isAdmin(req.user?.roleCodes));
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  create(@Body() dto: CreatePageDto) {
    return this.pagesService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pagesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.pagesService.remove(id);
  }
}

function isAdmin(roles?: string[]) {
  return (roles ?? []).some((role) => ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(role));
}
