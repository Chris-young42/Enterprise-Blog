import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { MediaType } from '@prisma/client';

export class CreateMediaAssetDto {
  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  @MaxLength(128)
  objectKey!: string;

  @IsString()
  @MaxLength(255)
  originalName!: string;

  @IsString()
  @MaxLength(128)
  mimeType!: string;

  @IsInt()
  @Min(0)
  size!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  bucket?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  extension?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;
}
