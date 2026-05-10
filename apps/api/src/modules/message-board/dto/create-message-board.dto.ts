import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateMessageBoardDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
