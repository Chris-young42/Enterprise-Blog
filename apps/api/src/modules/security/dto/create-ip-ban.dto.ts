import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIpBanDto {
  @IsString()
  @MaxLength(128)
  ip!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  reason?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

