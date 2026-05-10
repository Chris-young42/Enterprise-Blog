import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateFriendLinkDto {
  @IsString()
  @MaxLength(128)
  name!: string;

  @IsString()
  @MaxLength(255)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
