import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SiteConfigsService } from './site-configs.service';
import {
  UpsertAppearanceConfigDto,
  UpsertNavConfigDto,
  UpsertSiteConfigDto,
} from './dto/upsert-site-config.dto';

@Controller('site-configs')
export class SiteConfigsController {
  constructor(private readonly siteConfigsService: SiteConfigsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  list() {
    return this.siteConfigsService.list();
  }

  @Public()
  @Get('public/nav')
  getPublicNav() {
    return this.siteConfigsService.getNav();
  }

  @Public()
  @Get('public/side-nav')
  getPublicSideNav() {
    return this.siteConfigsService.getSideNav();
  }

  @Public()
  @Get('public/appearance')
  getPublicAppearance() {
    return this.siteConfigsService.getAppearance();
  }

  @Get(':key')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  getByKey(@Param('key') key: string) {
    return this.siteConfigsService.getByKey(key);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  upsert(@Body() dto: UpsertSiteConfigDto) {
    return this.siteConfigsService.upsert(dto);
  }

  @Post('nav')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  upsertNav(@Body() dto: UpsertNavConfigDto) {
    return this.siteConfigsService.upsertNav(dto.items);
  }

  @Post('side-nav')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  upsertSideNav(@Body() dto: UpsertNavConfigDto) {
    return this.siteConfigsService.upsertSideNav(dto.items);
  }

  @Post('appearance')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  upsertAppearance(@Body() dto: UpsertAppearanceConfigDto) {
    return this.siteConfigsService.upsertAppearance(dto);
  }
}