import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../../services/auth/auth.service';
import { Strategy } from 'passport-custom';
import { Request } from 'express';

@Injectable()
export class AccessTokenService extends PassportStrategy(
  Strategy,
  'accessToken',
) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  public async validate(content: Request): Promise<any> {
    // aborting with 404 as accept content is not correct
    if (content.headers.accept !== 'application/json') {
      throw new NotFoundException();
    }

    // @Todo add dto for basic requirement
    const payload = content.body;

    // @todo add check for client ids

    const user = this.authService.validateForPassword(
      'payload.email',
      'payload.password',
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    // @Todo attach client
    return { user, client: 'any' };
  }
}
