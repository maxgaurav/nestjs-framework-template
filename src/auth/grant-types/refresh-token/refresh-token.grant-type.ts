import {
  Injectable,
  Scope,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import {
  GrantTypeImplementation,
  GrantTypeResult,
} from '../grant-type-implementation.js';
import { AuthService } from '../../services/auth/auth.service.js';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service.js';
import { AccessTokenDto } from '../../dtos/access-token.dto.js';
import { RefreshTokenModel } from '../../../databases/models/oauth/refresh-token.model.js';
import { AccessTokenModel } from '../../../databases/models/oauth/access-token.model.js';
import { UserModel } from '../../../databases/models/user.model.js';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator.js';

const invalid = (property: string, message: string) =>
  new UnprocessableEntityException([
    { property, constraints: { [property]: message }, children: [] },
  ] satisfies ValidationError[]);

/**
 * RFC 6749 §6 refresh: `grant_type=refresh_token` with `refresh_token`, `client_id`,
 * `client_secret` on the token endpoint. The refresh token must belong to the authenticating
 * client and be unexpired; the token endpoint then rotates it (old pair revoked, new pair
 * issued) inside the request transaction.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class RefreshTokenGrantType implements GrantTypeImplementation {
  constructor(
    protected authService: AuthService,
    protected clientRepo: ClientRepoService,
  ) {}

  @LoggingDecorator({
    messageBefore: 'Oauth2: validating refresh token grant',
    messageAfter: 'Oauth2: refresh token grant is valid',
  })
  public async validate(
    payload: Required<AccessTokenDto>,
  ): Promise<GrantTypeResult> {
    // Only active clients authenticate (findForIdAndSecret excludes revoked ones)
    const client = await this.clientRepo.findForIdAndSecret(
      payload.client_id as string,
      payload.client_secret as string,
    );
    if (!client) {
      throw invalid('credentials', 'Client credentials are invalid');
    }

    const refreshToken = await this.findRefreshToken(
      payload.refresh_token as string,
    );
    const accessToken = refreshToken
      ? await refreshToken.$get('accessToken')
      : null;

    // Unknown, expired, already rotated, or issued to another client: all the same answer
    if (
      !refreshToken ||
      !accessToken ||
      this.isExpired(refreshToken) ||
      accessToken.client_id !== client.id
    ) {
      throw invalid('refresh_token', 'The refresh token is invalid or expired');
    }

    const user = await this.userOf(accessToken);
    return { client, user, refreshToken };
  }

  /** A malformed or wrongly signed token is an invalid grant, not a server error */
  protected async findRefreshToken(
    token: string,
  ): Promise<RefreshTokenModel | null> {
    try {
      return await this.authService.findRefreshToken(token);
    } catch {
      return null;
    }
  }

  protected isExpired(refreshToken: RefreshTokenModel): boolean {
    return (
      !!refreshToken.expires_at &&
      Date.now() > new Date(refreshToken.expires_at).getTime()
    );
  }

  protected async userOf(accessToken: AccessTokenModel): Promise<UserModel> {
    const user = await accessToken.$get('user');
    if (!user) {
      throw invalid('refresh_token', 'The refresh token is invalid or expired');
    }
    return user;
  }
}
