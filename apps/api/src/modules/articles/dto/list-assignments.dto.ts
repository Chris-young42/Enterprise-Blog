import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListAssignmentsDto {
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'])
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
}
