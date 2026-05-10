import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MediaType } from '@prisma/client';

export class CreateUploadPlanDto {
  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  @MaxLength(255)
  originalName!: string;

  @IsString()
  @MaxLength(128)
  mimeType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  folder?: string;
}
