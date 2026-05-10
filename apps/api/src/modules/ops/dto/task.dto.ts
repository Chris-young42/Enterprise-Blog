import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class RestoreTaskDto {
  @IsString()
  @MaxLength(1024)
  restoreFrom!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  confirmToken?: string;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  confirmPhrase?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  approvalReason?: string;
}

export class MigrateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  target?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  confirmToken?: string;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  confirmPhrase?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  approvalReason?: string;
}

export class RestorePrecheckDto {
  @IsString()
  @MaxLength(1024)
  restoreFrom!: string;
}
