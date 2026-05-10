import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MaxLength(64)
  name!: string;

  @IsString()
  @MaxLength(64)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
