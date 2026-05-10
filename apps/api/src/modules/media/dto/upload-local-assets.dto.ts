import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MediaType } from '@prisma/client';

export class UploadLocalAssetsDto {
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  folder?: string;
}
