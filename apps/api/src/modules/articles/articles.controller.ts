import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesDto } from './dto/list-articles.dto';
import { PasswordAccessDto } from './dto/password-access.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { BatchIdsDto } from './dto/batch-ids.dto';
import { BatchToggleDto } from './dto/batch-toggle.dto';
import { BatchMoveCategoryDto } from './dto/batch-move-category.dto';

type AuthRequest = {
  user?: {
    sub: string;
    roleCodes: string[];
  };
};

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  create(@Req() req: AuthRequest, @Body() dto: CreateArticleDto) {
    if (!req.user) return null;
    return this.articlesService.create(req.user, dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  update(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateArticleDto) {
    if (!req.user) return null;
    return this.articlesService.update(req.user, id, dto);
  }

  @Post(':id/draft')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  saveDraft(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateArticleDto) {
    if (!req.user) return null;
    return this.articlesService.saveDraft(req.user, id, dto);
  }

  @Post(':id/schedule')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  schedule(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { scheduledAt: string },
  ) {
    if (!req.user) return null;
    return this.articlesService.schedule(req.user, id, dto.scheduledAt);
  }

  @Post(':id/publish')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  publish(@Req() req: AuthRequest, @Param('id') id: string) {
    if (!req.user) return null;
    return this.articlesService.publish(req.user, id);
  }

  @Public()
  @Get()
  list(@Req() req: AuthRequest, @Query() query: ListArticlesDto) {
    return this.articlesService.list(req.user ?? null, query);
  }

  @Public()
  @Get('hot')
  hot(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 10;
    return this.articlesService.hot(Number.isNaN(parsed) ? 10 : parsed);
  }

  @Public()
  @Get('archive')
  archive() {
    return this.articlesService.archive();
  }

  @Public()
  @Post(':slug/access')
  accessWithPassword(
    @Req() req: AuthRequest,
    @Param('slug') slug: string,
    @Body() dto: PasswordAccessDto,
  ) {
    return this.articlesService.detail(req.user ?? null, slug, dto.password);
  }

  @Public()
  @Get(':slug')
  detail(@Req() req: AuthRequest, @Param('slug') slug: string) {
    return this.articlesService.detail(req.user ?? null, slug);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    if (!req.user) return null;
    return this.articlesService.remove(req.user, id);
  }

  @Post('batch/delete')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  batchDelete(@Req() req: AuthRequest, @Body() dto: BatchIdsDto) {
    if (!req.user) return null;
    return this.articlesService.batchDelete(req.user, dto);
  }

  @Post('batch/pinned')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  batchPinned(@Req() req: AuthRequest, @Body() dto: BatchToggleDto) {
    if (!req.user) return null;
    return this.articlesService.batchSetPinned(req.user, dto);
  }

  @Post('batch/recommended')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  batchRecommended(@Req() req: AuthRequest, @Body() dto: BatchToggleDto) {
    if (!req.user) return null;
    return this.articlesService.batchSetRecommended(req.user, dto);
  }

  @Post('batch/move-category')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  batchMoveCategory(@Req() req: AuthRequest, @Body() dto: BatchMoveCategoryDto) {
    if (!req.user) return null;
    return this.articlesService.batchMoveCategory(req.user, dto);
  }
}
