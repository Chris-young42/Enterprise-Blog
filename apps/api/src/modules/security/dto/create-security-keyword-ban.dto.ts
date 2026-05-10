import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSecurityKeywordBanDto {
  @IsString()
  @MaxLength(128)
  keyword!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  reason?: string;
}

