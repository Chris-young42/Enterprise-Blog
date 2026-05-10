import { IsOptional, IsString } from 'class-validator';
import { BatchIdsDto } from './batch-ids.dto';

export class BatchMoveSeriesDto extends BatchIdsDto {
  @IsOptional()
  @IsString()
  seriesId?: string;
}
