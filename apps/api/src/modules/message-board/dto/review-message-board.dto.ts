import { IsEnum } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class ReviewMessageBoardDto {
  @IsEnum(ReviewStatus)
  status!: ReviewStatus;
}
