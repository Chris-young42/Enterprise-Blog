import { IsOptional, IsString } from 'class-validator';

export class ListMessageBoardDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  isAnonymous?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}
