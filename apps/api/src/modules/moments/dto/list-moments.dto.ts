import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class ListMomentsDto {
  @IsOptional()
  @IsBooleanString()
  published?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
