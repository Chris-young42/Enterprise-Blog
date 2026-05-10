import { IsOptional, IsString } from 'class-validator';
import { BatchIdsDto } from './batch-ids.dto';

export class BatchMoveCategoryDto extends BatchIdsDto {
  @IsOptional()
  @IsString()
  categoryId?: string;
}
