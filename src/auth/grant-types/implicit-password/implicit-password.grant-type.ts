import {
  Injectable,
  Scope,
  UnauthorizedException,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { GrantTypeImplementation } from '../grant-type-implementation';
import { ClientModel } from '../../../databases/models/oauth/client.model';
import { UserModel } from '../../../databases/models/user.model';
import { AuthService } from '../../services/auth/auth.service';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';
import { AccessTokenDto } from '../../dtos/access-token.dto';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';

@Injectable({ scope: Scope.TRANSIENT })
export class ImplicitPasswordGrantType implements GrantTypeImplementation {
  constructor(
    protected authService: AuthService,
    protected clientRepo: ClientRepoService,
  ) {}

  @LoggingDecorator({
    messageBefore:
      'Oauth2: using implicit password to find user with email and password provided along with client credentials',
    messageAfter:
      'Oauth2: credentials provided are correct for email and password',
  })
  public async validate(
    payload: Required<AccessTokenDto>,
  ): Promise<{ client: ClientModel; user: UserModel }> {
    const client = await this.clientRepo.findForIdAndSecret(
      payload.client_id as string,
      payload.client_secret as string,
    );

    if (!client) {
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

    const user = await this.authService.validateForPassword(
      payload.email as string,
      payload.password as string,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      user,
      client,
    };
  }
}
