import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDownloadResourceDto {
  @IsString()
  @MaxLength(150)
  title!: string;

  @IsString()
  mediaAssetId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  accessLevel?: string;
}
