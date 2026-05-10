import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class BatchIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];
}
