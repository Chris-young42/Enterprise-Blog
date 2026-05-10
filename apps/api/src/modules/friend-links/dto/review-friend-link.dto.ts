import { IsEnum } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class ReviewFriendLinkDto {
  @IsEnum(ReviewStatus)
  status!: ReviewStatus;
}
