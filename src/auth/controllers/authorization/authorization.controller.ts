import {
  Controller,
  Get,
  Post,
  Query,
  Render,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SessionErrorValidationInterceptor } from '../../../session-manager/interceptors/session-error-validation/session-error-validation.interceptor';
import { OldInputsInterceptor } from '../../../session-manager/interceptors/old-inputs/old-inputs.interceptor';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';
import { AuthorizationDto } from '../../dtos/authorization.dto';
import { RedirectGenerator } from '../../../common/decorators/redirect-generator.decorator';
import { AuthorizationRedirector } from '../../redirections/authorization/authorization.redirector';
import { AuthorizationGuard } from '../../guards/authorization/authorization.guard';
import { RedirectRouteInterceptor } from '../../../common/interceptors/redirect-route/redirect-route.interceptor';
import { TransactionInterceptor } from '../../../transaction-manager/interceptors/transaction/transaction.interceptor';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { UserModel } from '../../../databases/models/user.model';
import { ReqTransaction } from '../../../transaction-manager/decorators/transaction.decorator';
import { Transaction } from 'sequelize';
import { GrantTypes } from '../../grant-types/grant-type-implementation';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('oauth/authorization')
export class AuthorizationController {
  constructor(
    protected readonly hashEncrypt: HashEncryptService,
    protected readonly authorizationChallengeRepo: AuthorizationChallengeRepoService,
  ) {}

  @UseInterceptors(SessionErrorValidationInterceptor, OldInputsInterceptor)
  @Render('login')
  @Get()
  @LoggingDecorator({
    messageBefore: 'Starting Authorization server login flow',
  })
  public async showLogin(@Query() grantContent: AuthorizationDto) {
    return {
      token: await this.hashEncrypt.encrypt(JSON.stringify(grantContent)),
    };
  }

  @RedirectGenerator(AuthorizationRedirector)
  @UseGuards(AuthorizationGuard)
  @UseInterceptors(
    RedirectRouteInterceptor,
    SessionErrorValidationInterceptor,
    OldInputsInterceptor,
    TransactionInterceptor,
  )
  @Post('login')
  @LoggingDecorator({
    messageBefore:
      'Oauth2: Starting to generate the authorization challenge against the grant type',
    messageAfter:
      'Oauth2: Authorization successful for credentials and grant type. Redirecting back with redirect url',
  })
  public async processLoginAttempt(
    @AuthUser()
    {
      user,
      authorization,
    }: {
      user: UserModel;
      authorization: AuthorizationDto;
    },
    @ReqTransaction() transaction?: Transaction,
  ) {
    switch (authorization.grant_type) {
      case GrantTypes.PKCE:
        return this.authorizationChallengeRepo.createWithCodeChallenge(
          user,
          authorization.client_id,
          {
            challenge: authorization.code_challenge,
            algorithm: authorization.algorithm,
          },
          transaction,
        );
      case GrantTypes.AuthorizationCode:
        return this.authorizationChallengeRepo.createForAuthorizationCode(
          user,
          authorization.client_id,
          transaction,
        );
      default:
        throw new Error(
          `Grant type ${authorization.grant_type} is not allowed in authorization flow`,
        );
    }
  }
}
