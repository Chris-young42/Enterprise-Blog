import { IsBoolean } from 'class-validator';
import { BatchIdsDto } from './batch-ids.dto';

export class BatchToggleDto extends BatchIdsDto {
  @IsBoolean()
  value!: boolean;
}
