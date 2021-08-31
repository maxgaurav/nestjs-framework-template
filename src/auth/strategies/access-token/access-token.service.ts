import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../../services/auth/auth.service';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AccessTokenDto } from '../../dtos/access-token/access-token.dto';
import { validateOrReject } from 'class-validator';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';

@Injectable()
export class AccessTokenService extends PassportStrategy(
  Strategy,
  'accessToken',
) {
  constructor(
    private readonly authService: AuthService,
    private clientRepo: ClientRepoService,
  ) {
    super();
  }

  public async validate(content: Request): Promise<any> {
    // aborting with 404 as accept content is not correct
    if (content.headers.accept !== 'application/json') {
      throw new NotFoundException();
    }

    const payload = new AccessTokenDto(content.body);
    try {
      await validateOrReject(payload);
    } catch (err) {
      throw new UnprocessableEntityException(err);
    }

    const user = await this.authService.validateForPassword(
      payload.email,
      payload.password,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      user,
      client: await this.clientRepo.findOrFail(payload.client_id),
    };
  }
}
