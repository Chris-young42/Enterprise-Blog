import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePageDto {
  @IsString()
  @MaxLength(128)
  title!: string;

  @IsString()
  @MaxLength(64)
  slug!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoDescription?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
