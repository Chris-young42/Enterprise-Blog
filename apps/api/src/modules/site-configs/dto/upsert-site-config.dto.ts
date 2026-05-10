import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertSiteConfigDto {
  @IsString()
  @MaxLength(128)
  key!: string;

  value!: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class NavItemDto {
  @IsString()
  @MaxLength(64)
  label!: string;

  @IsString()
  @MaxLength(255)
  href!: string;
}

export class UpsertNavConfigDto {
  @IsArray()
  items!: NavItemDto[];
}
