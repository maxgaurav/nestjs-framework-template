import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsString()
  public password: string;

  constructor(content: { email?: string; password?: string } = {}) {
    if (content.email) {
      this.email = content.email;
    }

    if (content.password) {
      this.password = content.password;
    }
  }
}
