import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsUUID(4)
  public client_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public client_secret: string;

  constructor(content: { [key: string]: any } = {}) {
    for (const key in content) {
      /* istanbul ignore next */
      if (content.hasOwnProperty(key)) {
        this[key] = content[key];
      }
    }
  }
}
