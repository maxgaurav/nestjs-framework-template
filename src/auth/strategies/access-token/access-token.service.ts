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
import { UserModel } from '../../../databases/models/user.model';
import { ClientModel } from '../../../databases/models/oauth/client.model';

@Injectable()
export class AccessTokenService extends PassportStrategy(
  Strategy,
  'accessToken',
) {
  constructor(
    private readonly authService: AuthService,
    private readonly clientRepo: ClientRepoService,
  ) {
    super();
  }

  /**
   * Main validation action
   * @param request
   */
  public async validate(
    request: Request,
  ): Promise<{ user: UserModel; client: ClientModel }> {
    // aborting with 404 as accept content is not correct
    if (request.headers.accept.toLowerCase() !== 'application/json') {
      throw new NotFoundException();
    }

    const payload = await this.validateContent(request.body, AccessTokenDto);
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

  /**
   * Validate content of body and return dto object
   * @param body
   * @param dtoInstance
   */
  public async validateContent(
    body: {
      [key: string]: any;
    },
    dtoInstance: { new (content: any): AccessTokenDto },
  ): Promise<AccessTokenDto> {
    const payload = new dtoInstance(body);
    try {
      await validateOrReject(payload);
    } catch (err) {
      throw new UnprocessableEntityException(err);
    }

    return payload;
  }
}
