import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class AppearanceWidgetsDto {
  @IsBoolean()
  hotArticles!: boolean;

  @IsBoolean()
  latestArticles!: boolean;

  @IsBoolean()
  tagCloud!: boolean;

  @IsBoolean()
  archive!: boolean;
}

export class AppearanceAnimationsDto {
  @IsBoolean()
  pageLoad!: boolean;

  @IsBoolean()
  contentReveal!: boolean;

  @IsBoolean()
  interactive!: boolean;
}

export class UpsertAppearanceConfigDto {
  @IsIn(['light', 'dark', 'system'])
  themeMode!: 'light' | 'dark' | 'system';

  @IsIn(['ocean', 'sunset', 'forest'])
  themePreset!: 'ocean' | 'sunset' | 'forest';

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  wallpaperUrl?: string;

  @IsIn(['sans', 'serif', 'mono'])
  fontFamily!: 'sans' | 'serif' | 'mono';

  @IsIn(['sm', 'md', 'lg'])
  fontScale!: 'sm' | 'md' | 'lg';

  @ValidateNested()
  @Type(() => AppearanceWidgetsDto)
  widgets!: AppearanceWidgetsDto;

  @ValidateNested()
  @Type(() => AppearanceAnimationsDto)
  animations!: AppearanceAnimationsDto;

  @IsBoolean()
  backToTop!: boolean;

  @IsBoolean()
  floatingAction!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  customCss?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  customJs?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  customHeadHtml?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  customFooterHtml?: string;
}