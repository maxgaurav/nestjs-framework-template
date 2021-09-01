import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public refresh_token: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
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
