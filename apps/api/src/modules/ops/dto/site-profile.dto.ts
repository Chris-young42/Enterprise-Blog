import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSiteProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  icp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  copyright?: string;
}