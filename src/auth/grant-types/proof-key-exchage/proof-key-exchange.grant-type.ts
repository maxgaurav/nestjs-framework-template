import { GrantTypeImplementation } from '../grant-type-implementation.js';
import {
  Injectable,
  Scope,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { ClientModel } from '../../../databases/models/oauth/client.model.js';
import { UserModel } from '../../../databases/models/user.model.js';
import { AccessTokenDto } from '../../dtos/access-token.dto.js';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service.js';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator.js';

@Injectable({ scope: Scope.TRANSIENT })
export class ProofKeyExchangeGrantType implements GrantTypeImplementation {
  constructor(
    protected authorizationChallengeRepo: AuthorizationChallengeRepoService,
  ) {}

  @LoggingDecorator({
    messageBefore: 'Oauth2: validating challenge with code verifier',
    messageAfter:
      'Oauth2: Challenge stored for the code is valid for the code verifier provided',
  })
  public async validate(
    payload: Required<AccessTokenDto>,
  ): Promise<{ client: ClientModel; user: UserModel }> {
    const result = await this.authorizationChallengeRepo.verifyChallenge(
      payload.code as string,
      payload.code_verifier as string,
    );

    // A client revoked after the authorization step must not receive tokens
    if (!result || result.client.is_revoked) {
      const errors: ValidationError[] = [
        {
          property: 'code_verifier',
          constraints: {
            credentials: 'Code verifier mismatch',
          },
          children: [],
        },
      ];
      throw new UnprocessableEntityException(errors);
    }

    return { user: result.user, client: result.client };
  }
}
