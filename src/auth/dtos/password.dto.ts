import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class PasswordDto {
  @IsNotEmpty()
  @IsString()
  public token: string;

  @IsNotEmpty()
  @IsEmail()
  public email: string;
}
