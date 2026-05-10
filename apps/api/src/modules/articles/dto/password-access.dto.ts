import { IsString, MinLength } from 'class-validator';

export class PasswordAccessDto {
  @IsString()
  @MinLength(1)
  password!: string;
}
