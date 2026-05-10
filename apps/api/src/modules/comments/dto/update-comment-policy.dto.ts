import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateCommentPolicyDto {
  @IsOptional()
  @IsBoolean()
  guestCommentEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoReviewEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['MANUAL', 'MIXED'])
  reviewMode?: 'MANUAL' | 'MIXED';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sensitiveWords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedUserIds?: string[];

  @IsOptional()
  @IsBoolean()
  captchaRequired?: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(600)
  commentCooldownSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  commentMaxPerHour?: number;

  @IsOptional()
  @IsBoolean()
  emailNotificationEnabled?: boolean;
}
