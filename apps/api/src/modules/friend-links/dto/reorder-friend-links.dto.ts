import { IsArray, IsString } from 'class-validator';

export class ReorderFriendLinksDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
