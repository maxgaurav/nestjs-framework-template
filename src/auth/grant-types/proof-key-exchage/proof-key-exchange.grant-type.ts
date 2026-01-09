import { GrantTypeImplementation } from '../grant-type-implementation';
import {
  Injectable,
  Scope,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { ClientModel } from '../../../databases/models/oauth/client.model';
import { UserModel } from '../../../databases/models/user.model';
import { AccessTokenDto } from '../../dtos/access-token.dto';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';

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

    if (!result) {
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
