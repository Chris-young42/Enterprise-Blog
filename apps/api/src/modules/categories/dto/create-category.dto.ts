import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  @MaxLength(64)
  name!: string;

  @IsString()
  @MaxLength(64)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
