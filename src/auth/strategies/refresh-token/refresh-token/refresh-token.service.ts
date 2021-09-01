import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { RefreshTokenModel } from '../../../../databases/models/oauth/refresh-token.model';
import { RefreshTokenDto } from '../../../dtos/refresh-token/refresh-token.dto';
import { validateOrReject } from 'class-validator';
import { AuthService } from '../../../services/auth/auth.service';

@Injectable()
export class RefreshTokenService extends PassportStrategy(
  Strategy,
  'refreshToken',
) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  public async validate(request: Request): Promise<RefreshTokenModel> {
    // aborting with 404 as accept content is not correct
    if (request.headers.accept.toLowerCase() !== 'application/json') {
      throw new NotFoundException();
    }

    const payload = await this.validateContent(request.body, RefreshTokenDto);

    const refreshToken = await this.authService.findRefreshToken(
      payload.refresh_token,
    );

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    return refreshToken;
  }

  /**
   * Validate the body content
   * @param body
   * @param dtoInstance
   */
  public async validateContent(
    body: { [key: string]: any },
    dtoInstance: { new (content: any): RefreshTokenDto },
  ): Promise<RefreshTokenDto> {
    const payload = new dtoInstance(body);
    try {
      await validateOrReject(payload);
    } catch (err) {
      throw new UnprocessableEntityException(err);
    }

    return payload;
  }
}
