import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MediaType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaAssetDto } from './dto/create-media-asset.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AttachAlbumItemDto } from './dto/attach-album-item.dto';
import { CreateDownloadResourceDto } from './dto/create-download-resource.dto';
import { AttachArticleAssetDto } from './dto/attach-article-asset.dto';
import { CreateUploadPlanDto } from './dto/create-upload-plan.dto';
import { UploadLocalAssetsDto } from './dto/upload-local-assets.dto';
import { MediaStorageAdapter } from './storage.adapter';

type RequestUser = {
  sub: string;
  roleCodes: string[];
};

type UploadedFileLike = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageAdapter: MediaStorageAdapter,
  ) {}

  createUploadPlan(dto: CreateUploadPlanDto) {
    return this.storageAdapter.createUploadPlan(dto);
  }

  async uploadLocalAssets(
    user: RequestUser,
    dto: UploadLocalAssetsDto,
    files: UploadedFileLike[],
  ) {
    if (files.length === 0) {
      throw new BadRequestException('files cannot be empty');
    }

    const created = await Promise.all(
      files.map(async (file) => {
        const mimeType = file.mimetype || 'application/octet-stream';
        const type = dto.type ?? inferMediaType(mimeType);
        const folder = dto.folder?.trim();
        const plan = await this.storageAdapter.createUploadPlan({
          type,
          originalName: file.originalname,
          mimeType,
          ...(folder ? { folder } : {}),
        });

        await this.storageAdapter.writeLocalFile(plan.objectKey, file.buffer);

        const row = await this.prisma.mediaAsset.create({
          data: {
            uploaderId: user.sub,
            type,
            bucket: plan.bucket,
            objectKey: plan.objectKey,
            originalName: file.originalname,
            mimeType,
            extension: extractExtension(file.originalname),
            size: BigInt(file.size),
          },
        });
        return this.mapAsset(row);
      }),
    );

    return created;
  }

  async createAsset(user: RequestUser, dto: CreateMediaAssetDto) {
    const created = await this.prisma.mediaAsset.create({
      data: {
        uploaderId: user.sub,
        type: dto.type,
        bucket: dto.bucket ?? null,
        objectKey: dto.objectKey,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        extension: dto.extension ?? null,
        size: BigInt(dto.size),
        width: dto.width ?? null,
        height: dto.height ?? null,
        durationSec: dto.durationSec ?? null,
      },
    });
    return this.mapAsset(created);
  }

  async listAssets(type?: MediaType) {
    const rows = await this.prisma.mediaAsset.findMany({
      where: {
        deletedAt: null,
        ...(type ? { type } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });
    return rows.map((item) => this.mapAsset(item));
  }

  async listPublicAssets(type?: MediaType) {
    const rows = await this.prisma.mediaAsset.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        ...(type ? { type } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });
    return rows.map((item) => this.mapAsset(item));
  }

  async createAlbum(dto: CreateAlbumDto) {
    const created = await this.prisma.album.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
        coverAssetId: dto.coverAssetId ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return created;
  }

  async listAlbums() {
    const albums = await this.prisma.album.findMany({
      where: { deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
          include: { mediaAsset: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return albums.map((album) => ({
      id: album.id,
      name: album.name,
      slug: album.slug,
      description: album.description,
      coverAssetId: album.coverAssetId,
      sortOrder: album.sortOrder,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      items: album.items.map((item) => ({
        id: item.id,
        sortOrder: item.sortOrder,
        mediaAsset: this.mapAsset(item.mediaAsset),
      })),
    }));
  }

  async attachAlbumItem(albumId: string, dto: AttachAlbumItemDto) {
    await this.assertAlbumExists(albumId);
    await this.assertAssetExists(dto.mediaAssetId);

    const existing = await this.prisma.albumItem.findFirst({
      where: { albumId, mediaAssetId: dto.mediaAssetId },
      select: { id: true, deletedAt: true },
    });
    if (existing) {
      await this.prisma.albumItem.update({
        where: { id: existing.id },
        data: { deletedAt: null, sortOrder: dto.sortOrder ?? 0 },
      });
      return { id: existing.id };
    }

    const created = await this.prisma.albumItem.create({
      data: {
        albumId,
        mediaAssetId: dto.mediaAssetId,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return { id: created.id };
  }

  async createDownloadResource(dto: CreateDownloadResourceDto) {
    await this.assertAssetExists(dto.mediaAssetId);
    const created = await this.prisma.downloadResource.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        mediaAssetId: dto.mediaAssetId,
        accessLevel: dto.accessLevel ?? 'PUBLIC',
      },
      include: { mediaAsset: true },
    });
    return {
      id: created.id,
      title: created.title,
      description: created.description,
      accessLevel: created.accessLevel,
      downloadCount: created.downloadCount,
      mediaAsset: this.mapAsset(created.mediaAsset),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async listDownloadResources() {
    const rows = await this.prisma.downloadResource.findMany({
      where: { deletedAt: null },
      include: { mediaAsset: true },
      orderBy: [{ createdAt: 'desc' }],
    });
    return rows.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      accessLevel: item.accessLevel,
      downloadCount: item.downloadCount,
      mediaAsset: this.mapAsset(item.mediaAsset),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async downloadResource(resourceId: string) {
    const resource = await this.prisma.downloadResource.findFirst({
      where: { id: resourceId, deletedAt: null },
      include: { mediaAsset: true },
    });
    if (!resource) {
      throw new NotFoundException('resource not found');
    }
    await this.prisma.downloadResource.update({
      where: { id: resourceId },
      data: { downloadCount: { increment: 1 } },
    });
    return {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      accessLevel: resource.accessLevel,
      downloadCount: resource.downloadCount + 1,
      mediaAsset: this.mapAsset(resource.mediaAsset),
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  async attachArticleAsset(user: RequestUser, dto: AttachArticleAssetDto) {
    await this.assertAssetExists(dto.mediaAssetId);
    const article = await this.prisma.article.findFirst({
      where: { id: dto.articleId, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!article) {
      throw new NotFoundException('article not found');
    }
    if (!hasPrivilegedRole(user.roleCodes) && article.authorId !== user.sub) {
      throw new BadRequestException('cannot attach asset to other author article');
    }

    const existing = await this.prisma.articleAttachment.findFirst({
      where: { articleId: dto.articleId, mediaAssetId: dto.mediaAssetId },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.articleAttachment.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
      return { id: existing.id };
    }

    const created = await this.prisma.articleAttachment.create({
      data: {
        articleId: dto.articleId,
        mediaAssetId: dto.mediaAssetId,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return { id: created.id };
  }

  async listArticleAssets(articleId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, deletedAt: null },
      select: { id: true },
    });
    if (!article) {
      throw new NotFoundException('article not found');
    }

    const rows = await this.prisma.articleAttachment.findMany({
      where: { articleId, deletedAt: null },
      include: { mediaAsset: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      articleId: row.articleId,
      sortOrder: row.sortOrder,
      mediaAsset: this.mapAsset(row.mediaAsset),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async removeAsset(user: RequestUser, assetId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, deletedAt: null },
      select: { id: true, uploaderId: true },
    });
    if (!asset) {
      throw new NotFoundException('media asset not found');
    }
    if (!hasPrivilegedRole(user.roleCodes) && asset.uploaderId !== user.sub) {
      throw new BadRequestException('cannot remove other uploader asset');
    }

    await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: { deletedAt: new Date() },
    });
    return { id: assetId };
  }

  async detachAlbumItem(itemId: string) {
    const item = await this.prisma.albumItem.findFirst({
      where: { id: itemId, deletedAt: null },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException('album item not found');
    }
    await this.prisma.albumItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });
    return { id: itemId };
  }

  async removeResource(resourceId: string) {
    const item = await this.prisma.downloadResource.findFirst({
      where: { id: resourceId, deletedAt: null },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException('resource not found');
    }
    await this.prisma.downloadResource.update({
      where: { id: resourceId },
      data: { deletedAt: new Date() },
    });
    return { id: resourceId };
  }

  async detachArticleAsset(user: RequestUser, attachmentId: string) {
    const item = await this.prisma.articleAttachment.findFirst({
      where: { id: attachmentId, deletedAt: null },
      include: {
        article: {
          select: {
            authorId: true,
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('attachment not found');
    }
    if (!hasPrivilegedRole(user.roleCodes) && item.article.authorId !== user.sub) {
      throw new BadRequestException('cannot detach other author attachment');
    }
    await this.prisma.articleAttachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date() },
    });
    return { id: attachmentId };
  }

  private async assertAlbumExists(albumId: string) {
    const album = await this.prisma.album.findFirst({
      where: { id: albumId, deletedAt: null },
      select: { id: true },
    });
    if (!album) throw new NotFoundException('album not found');
  }

  private async assertAssetExists(assetId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, deletedAt: null },
      select: { id: true },
    });
    if (!asset) throw new NotFoundException('media asset not found');
  }

  private mapAsset(row: {
    id: string;
    uploaderId: string | null;
    type: MediaType;
    bucket: string | null;
    objectKey: string;
    originalName: string;
    mimeType: string;
    extension: string | null;
    size: bigint;
    width: number | null;
    height: number | null;
    durationSec: number | null;
    checksum: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      uploaderId: row.uploaderId,
      type: row.type,
      bucket: row.bucket,
      objectKey: row.objectKey,
      originalName: row.originalName,
      mimeType: row.mimeType,
      extension: row.extension,
      size: Number(row.size),
      width: row.width,
      height: row.height,
      durationSec: row.durationSec,
      checksum: row.checksum,
      status: row.status,
      url: this.storageAdapter.buildPublicUrl(row.bucket, row.objectKey),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

function hasPrivilegedRole(roles: string[]) {
  return roles.some((role) => ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(role));
}

function inferMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  return 'FILE';
}

function extractExtension(originalName: string): string | null {
  const idx = originalName.lastIndexOf('.');
  if (idx <= 0 || idx === originalName.length - 1) return null;
  const ext = originalName.slice(idx + 1).toLowerCase();
  if (!/^[a-z0-9]{1,16}$/.test(ext)) return null;
  return ext;
}
