import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewCommentDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
