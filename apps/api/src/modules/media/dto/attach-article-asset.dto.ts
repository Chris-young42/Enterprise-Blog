import { IsInt, IsOptional, IsString } from 'class-validator';

export class AttachArticleAssetDto {
  @IsString()
  articleId!: string;

  @IsString()
  mediaAssetId!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
