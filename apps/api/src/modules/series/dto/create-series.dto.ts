import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  @MaxLength(128)
  title!: string;

  @IsString()
  @MaxLength(64)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  coverUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
