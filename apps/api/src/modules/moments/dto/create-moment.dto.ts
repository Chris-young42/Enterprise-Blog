import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMomentDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  slug?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
