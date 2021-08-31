import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AccessTokenDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsString()
  public password: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID(4)
  public client_id: string;

  @IsNotEmpty()
  @IsString()
  public client_secret: string;

  constructor(content: { [key: string]: any } = {}) {
    for (const key in content) {
      if (content.hasOwnProperty(key)) {
        this[key] = content[key];
      }
    }
  }
}
