import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSensitiveWordDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  keyword?: string;

  @IsOptional()
  @IsIn(['BLOCK', 'REPLACE', 'REVIEW'])
  level?: 'BLOCK' | 'REPLACE' | 'REVIEW';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  replaceWith?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}