import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { MediaType } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MediaService } from './media.service';
import { CreateMediaAssetDto } from './dto/create-media-asset.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AttachAlbumItemDto } from './dto/attach-album-item.dto';
import { CreateDownloadResourceDto } from './dto/create-download-resource.dto';
import { AttachArticleAssetDto } from './dto/attach-article-asset.dto';
import { CreateUploadPlanDto } from './dto/create-upload-plan.dto';
import { UploadLocalAssetsDto } from './dto/upload-local-assets.dto';

type AuthRequest = {
  user?: {
    sub: string;
    roleCodes: string[];
  };
};

type UploadedFileLike = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('assets')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  listAssets(@Query('type') type?: MediaType) {
    return this.mediaService.listAssets(type);
  }

  @Public()
  @Get('assets/public')
  listPublicAssets(@Query('type') type?: MediaType) {
    return this.mediaService.listPublicAssets(type);
  }

  @Post('assets')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  createAsset(@Req() req: AuthRequest, @Body() dto: CreateMediaAssetDto) {
    if (!req.user) return null;
    return this.mediaService.createAsset(req.user, dto);
  }

  @Post('assets/upload-local')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  @UseInterceptors(FilesInterceptor('files', 20))
  uploadLocalAssets(
    @Req() req: AuthRequest,
    @UploadedFiles() files: UploadedFileLike[],
    @Query() query: UploadLocalAssetsDto,
  ) {
    if (!req.user) return null;
    return this.mediaService.uploadLocalAssets(req.user, query, files ?? []);
  }

  @Post('assets/upload-plan')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  createUploadPlan(@Body() dto: CreateUploadPlanDto) {
    return this.mediaService.createUploadPlan(dto);
  }

  @Delete('assets/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  removeAsset(@Req() req: AuthRequest, @Param('id') id: string) {
    if (!req.user) return null;
    return this.mediaService.removeAsset(req.user, id);
  }

  @Get('albums')
  @Public()
  listAlbums() {
    return this.mediaService.listAlbums();
  }

  @Post('albums')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  createAlbum(@Body() dto: CreateAlbumDto) {
    return this.mediaService.createAlbum(dto);
  }

  @Post('albums/:id/items')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  attachAlbumItem(@Param('id') id: string, @Body() dto: AttachAlbumItemDto) {
    return this.mediaService.attachAlbumItem(id, dto);
  }

  @Delete('albums/items/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  detachAlbumItem(@Param('id') id: string) {
    return this.mediaService.detachAlbumItem(id);
  }

  @Get('resources')
  @Public()
  listResources() {
    return this.mediaService.listDownloadResources();
  }

  @Post('resources')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  createResource(@Body() dto: CreateDownloadResourceDto) {
    return this.mediaService.createDownloadResource(dto);
  }

  @Post('resources/:id/download')
  @Public()
  download(@Param('id') id: string) {
    return this.mediaService.downloadResource(id);
  }

  @Delete('resources/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  removeResource(@Param('id') id: string) {
    return this.mediaService.removeResource(id);
  }

  @Get('articles/:articleId/attachments')
  @Public()
  listArticleAssets(@Param('articleId') articleId: string) {
    return this.mediaService.listArticleAssets(articleId);
  }

  @Post('articles/attachments')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  attachArticleAsset(@Req() req: AuthRequest, @Body() dto: AttachArticleAssetDto) {
    if (!req.user) return null;
    return this.mediaService.attachArticleAsset(req.user, dto);
  }

  @Delete('articles/attachments/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR')
  detachArticleAsset(@Req() req: AuthRequest, @Param('id') id: string) {
    if (!req.user) return null;
    return this.mediaService.detachArticleAsset(req.user, id);
  }
}
