import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  public refresh_token: string;

  @IsNotEmpty()
  @IsUUID()
  public client_id: string;

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
