import { IsArray, IsEnum, IsString } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class BatchReviewMessageBoardDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];

  @IsEnum(ReviewStatus)
  status!: ReviewStatus;
}
