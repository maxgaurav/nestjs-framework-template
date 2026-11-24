import { GrantTypeImplementation } from '../grant-type-implementation.js';
import { ClientModel } from '../../../databases/models/oauth/client.model.js';
import { UserModel } from '../../../databases/models/user.model.js';
import {
  Injectable,
  Scope,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { AccessTokenDto } from '../../dtos/access-token.dto.js';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service.js';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator.js';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service.js';

@Injectable({ scope: Scope.TRANSIENT })
export class AuthorizationCodeGrantType implements GrantTypeImplementation {
  constructor(
    protected challengeRepo: AuthorizationChallengeRepoService,
    protected clientRepo: ClientRepoService,
  ) {}

  /**
   * Validates the payload for authorization code grant type with code provided
   * @param payload
   */
  @LoggingDecorator({
    messageBefore:
      'Oauth2: verifying code and client id for authorization code grant type',
    messageAfter: 'Oauth2: Verification of authorization code grant successful',
  })
  public async validate(
    payload: Required<AccessTokenDto>,
  ): Promise<{ client: ClientModel; user: UserModel }> {
    // RFC 6749 §4.1.3: the client authenticates (active client, matching secret) before its
    // code is redeemed; an unauthenticated attempt does not consume the code
    const client = await this.clientRepo.findForIdAndSecret(
      payload.client_id as string,
      payload.client_secret as string,
    );
    const result = client
      ? await this.challengeRepo.verifyWithClientId(
          payload.code as string,
          client.id,
        )
      : false;
    // A client revoked after the authorization step must not receive tokens
    if (!result || result.client.is_revoked) {
      const errors: ValidationError[] = [
        {
          property: 'credentials',
          constraints: {
            credentials: 'Client credentials are invalid',
          },
          children: [],
        },
      ];

      throw new UnprocessableEntityException(errors);
    }

    return {
      user: result.user,
      client: result.client,
    };
  }
}
