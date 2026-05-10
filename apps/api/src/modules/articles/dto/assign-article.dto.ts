import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignArticleDto {
  @IsString()
  assigneeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  note?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'])
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
}
