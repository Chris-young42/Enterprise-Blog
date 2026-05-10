import { IsEnum } from 'class-validator';
import { ContentVisibility } from '@prisma/client';
import { BatchIdsDto } from './batch-ids.dto';

export class BatchVisibilityDto extends BatchIdsDto {
  @IsEnum(ContentVisibility)
  visibility!: ContentVisibility;
}
