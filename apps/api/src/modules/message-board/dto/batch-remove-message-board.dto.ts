import { IsArray, IsString } from 'class-validator';

export class BatchRemoveMessageBoardDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
