import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ListCommentsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  @IsUUID()
  rootId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['latest', 'hot'])
  sort?: 'latest' | 'hot';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  onlyAuthor?: number;
}
