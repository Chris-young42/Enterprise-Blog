import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class ListPagesDto {
  @IsOptional()
  @IsBooleanString()
  published?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
