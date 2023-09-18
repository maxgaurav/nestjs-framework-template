import { IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AuthorizationDto } from './authorization.dto';

export class LoginDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AuthorizationDto)
  public token: AuthorizationDto;

  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsString()
  public password: string;
}
