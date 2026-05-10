import { IsInt, IsOptional, IsString } from 'class-validator';

export class AttachAlbumItemDto {
  @IsString()
  mediaAssetId!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
