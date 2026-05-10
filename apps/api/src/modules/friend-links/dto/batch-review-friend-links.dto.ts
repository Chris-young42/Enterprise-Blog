import { IsArray, IsEnum, IsString } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class BatchReviewFriendLinksDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];

  @IsEnum(ReviewStatus)
  status!: ReviewStatus;
}
