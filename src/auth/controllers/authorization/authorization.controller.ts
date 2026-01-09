import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Render,
  UseGuards,
  UseInterceptors,
  Session as SessionDecorator,
  Header,
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
import { PasswordDto } from '../../dtos/password.dto';
import { randomUUID } from 'node:crypto';
import { PasswordRedirector } from '../../redirections/password/password.redirector';
import { Session } from 'express-session';
import { CheckShowPasswordGuard } from '../../guards/check-show-password/check-show-password.guard';
import { CanRestartLoginGuard } from '../../guards/can-restart-login/can-restart-login.guard';
import { RestartLoginRedirector } from '../../redirectors/restart-login/restart-login.redirector';
import { AppendFormActionHeaderInterceptor } from '../../interceptors/append-form-action-header/append-form-action-header.interceptor';
import { AuthorizationChallengeModel } from '../../../databases/models/oauth/authorization-challenge.model';
import { MapUserToSessionInterceptor } from '../../interceptors/map-user-to-session/map-user-to-session.interceptor';

@ApiExcludeController()
@Controller('oauth/authorization')
export class AuthorizationController {
  constructor(
    protected readonly hashEncrypt: HashEncryptService,
    protected readonly authorizationChallengeRepo: AuthorizationChallengeRepoService,
  ) {}

  @UseInterceptors(SessionErrorValidationInterceptor, OldInputsInterceptor)
  @Render('authorization/login')
  @Get()
  @LoggingDecorator({
    messageBefore: 'Starting Authorization server with entry login flow',
  })
  public async showLogin(@Query() grantContent: AuthorizationDto) {
    return {
      token: await this.hashEncrypt.encrypt(JSON.stringify(grantContent)),
    };
  }

  @RedirectGenerator(PasswordRedirector)
  @UseInterceptors(
    RedirectRouteInterceptor,
    SessionErrorValidationInterceptor,
    OldInputsInterceptor,
  )
  @Post('password')
  @LoggingDecorator({
    messageBefore:
      'Starting Authorization flow for email password login flow and registering token for get page',
  })
  public async registerEmailForPasswordFlow(
    @Body() passwordDto: PasswordDto,
    @SessionDecorator() session: Session,
  ) {
    const passwordId = randomUUID();
    (session as any).passwordContent = { ...passwordDto, passwordId };
    await new Promise((res) => session.save(() => res(true)));
    return (session as any).passwordContent;
  }

  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @UseGuards(CheckShowPasswordGuard)
  @UseInterceptors(
    SessionErrorValidationInterceptor,
    OldInputsInterceptor,
    AppendFormActionHeaderInterceptor,
  )
  @Get('password')
  @Render('authorization/password')
  @LoggingDecorator({
    messageBefore: 'Rendering password screen for login flow',
  })
  public showPassword() {
    return {};
  }

  @RedirectGenerator(RestartLoginRedirector)
  @UseGuards(CanRestartLoginGuard)
  @UseInterceptors(
    RedirectRouteInterceptor,
    SessionErrorValidationInterceptor,
    OldInputsInterceptor,
  )
  @Get('restart-login')
  @LoggingDecorator({
    messageBefore:
      'Oauth2: Clearing password form state and redirecting back to login for restart process',
  })
  public restartLoginFlow(@SessionDecorator() session: Session) {
    const passwordContent = (session as any).passwordContent;
    (session as any).passwordContent = undefined;

    return passwordContent;
  }

  @RedirectGenerator(AuthorizationRedirector)
  @UseGuards(AuthorizationGuard)
  @UseInterceptors(
    RedirectRouteInterceptor,
    SessionErrorValidationInterceptor,
    OldInputsInterceptor,
    MapUserToSessionInterceptor,
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
  ): Promise<AuthorizationChallengeModel> {
    switch (authorization.grant_type) {
      case GrantTypes.PKCE:
        return this.authorizationChallengeRepo.createWithPkceCodeChallenge(
          user,
          authorization.client_id,
          {
            challenge: authorization.code_challenge as string,
            algorithm: authorization.algorithm as string,
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
