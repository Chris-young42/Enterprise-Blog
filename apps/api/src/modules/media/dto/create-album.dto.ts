import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(120)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  coverAssetId?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
