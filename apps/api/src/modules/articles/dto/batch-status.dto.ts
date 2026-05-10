import { IsIn, IsOptional } from 'class-validator';
import { BatchIdsDto } from './batch-ids.dto';

export class BatchStatusDto extends BatchIdsDto {
  @IsIn(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'])
  status!: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

  @IsOptional()
  publishNow?: boolean;
}
