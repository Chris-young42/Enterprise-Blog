import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { MediaType } from '@prisma/client';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type CreateUploadPlanInput = {
  type: MediaType;
  originalName: string;
  mimeType: string;
  folder?: string;
};

@Injectable()
export class MediaStorageAdapter {
  constructor(private readonly configService: ConfigService) {}

  async createUploadPlan(input: CreateUploadPlanInput) {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const provider = (this.configService.get<string>('app.storageProvider') ?? 'LOCAL').toUpperCase();
    const bucket = this.configService.get<string>('app.storageBucket') ?? 'enterprise-blog';
    const baseUrl = this.configService.get<string>('app.storagePublicBaseUrl') ?? '';
    const expiresInSeconds = this.configService.get<number>('app.storageSignedExpiresInSeconds') ?? 900;
    const folderPrefix = (input.folder ?? input.type.toLowerCase()).trim().replace(/^\/+|\/+$/g, '');
    const ext = extractExtension(input.originalName);
    const safeFolderPrefix = folderPrefix.length > 0 ? folderPrefix : input.type.toLowerCase();
    const objectKey = `${safeFolderPrefix}/${year}/${month}/${randomUUID()}${ext}`;
    const publicUrl = baseUrl ? `${baseUrl.replace(/\/+$/g, '')}/${objectKey}` : null;
    const headers = {
      'Content-Type': input.mimeType,
    };

    if (provider === 'S3') {
      const client = this.createS3Client();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: input.mimeType,
      });
      const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
      return {
        provider,
        bucket,
        objectKey,
        uploadMethod: 'PUT' as const,
        uploadUrl,
        publicUrl: publicUrl ?? this.buildS3PublicUrl(bucket, objectKey),
        headers,
        expiresInSeconds,
      };
    }

    const uploadUrl = baseUrl ? `${baseUrl.replace(/\/+$/g, '')}/${objectKey}` : '';

    return {
      provider,
      bucket,
      objectKey,
      uploadMethod: 'PUT' as const,
      uploadUrl,
      publicUrl,
      headers,
      expiresInSeconds,
    };
  }

  buildPublicUrl(bucket: string | null, objectKey: string) {
    const baseUrl = this.configService.get<string>('app.storagePublicBaseUrl') ?? '';
    if (!baseUrl) return null;
    return `${baseUrl.replace(/\/+$/g, '')}/${objectKey}`;
  }

  resolveUploadDirectory() {
    const configured = this.configService.get<string>('app.storageUploadDir');
    if (configured && configured.trim().length > 0) {
      return configured;
    }
    return join(process.cwd(), 'uploads');
  }

  async writeLocalFile(objectKey: string, data: Buffer) {
    const uploadRoot = this.resolveUploadDirectory();
    const targetPath = join(uploadRoot, ...objectKey.split('/').filter(Boolean));
    const directory = dirname(targetPath);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(targetPath, data);
  }

  private createS3Client() {
    const region = this.configService.get<string>('app.s3Region') || 'us-east-1';
    const endpoint = this.configService.get<string>('app.s3Endpoint') || '';
    const accessKeyId = this.configService.get<string>('app.s3AccessKeyId') || '';
    const secretAccessKey = this.configService.get<string>('app.s3SecretAccessKey') || '';
    const sessionToken = this.configService.get<string>('app.s3SessionToken') || '';
    const forcePathStyle = (this.configService.get<string>('app.s3ForcePathStyle') ?? 'false') === 'true';
    const hasCredentials = accessKeyId.length > 0 && secretAccessKey.length > 0;
    const credentials = hasCredentials
      ? {
          accessKeyId,
          secretAccessKey,
          ...(sessionToken ? { sessionToken } : {}),
        }
      : null;

    const config = {
      region,
      forcePathStyle,
      ...(endpoint ? { endpoint } : {}),
      ...(credentials ? { credentials } : {}),
    };

    return new S3Client(config);
  }

  private buildS3PublicUrl(bucket: string, objectKey: string) {
    const endpoint = this.configService.get<string>('app.s3Endpoint') || '';
    const region = this.configService.get<string>('app.s3Region') || 'us-east-1';
    const forcePathStyle = (this.configService.get<string>('app.s3ForcePathStyle') ?? 'false') === 'true';
    const normalizedKey = objectKey.replace(/^\/+/, '');
    if (endpoint) {
      const base = endpoint.replace(/\/+$/g, '');
      return forcePathStyle ? `${base}/${bucket}/${normalizedKey}` : `${base}/${normalizedKey}`;
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${normalizedKey}`;
  }
}

function extractExtension(originalName: string) {
  const idx = originalName.lastIndexOf('.');
  if (idx <= 0 || idx === originalName.length - 1) {
    return '';
  }
  const ext = originalName.slice(idx).toLowerCase();
  if (!/^\.[a-z0-9]{1,16}$/.test(ext)) {
    return '';
  }
  return ext;
}
