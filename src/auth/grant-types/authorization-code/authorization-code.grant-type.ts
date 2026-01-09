import { GrantTypeImplementation } from '../grant-type-implementation';
import { ClientModel } from '../../../databases/models/oauth/client.model';
import { UserModel } from '../../../databases/models/user.model';
import {
  Injectable,
  Scope,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { AccessTokenDto } from '../../dtos/access-token.dto';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';

@Injectable({ scope: Scope.TRANSIENT })
export class AuthorizationCodeGrantType implements GrantTypeImplementation {
  constructor(protected challengeRepo: AuthorizationChallengeRepoService) {}

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
    const result = await this.challengeRepo.verifyWithClientId(
      payload.code as string,
      payload.client_id as string,
    );
    if (!result) {
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
