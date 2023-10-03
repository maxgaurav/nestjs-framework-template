import { Global, Module } from '@nestjs/common';
import { AuthService } from './services/auth/auth.service';
import { HashEncryptService } from './services/hash-encrypt/hash-encrypt.service';
import { UserRepoService } from '../user/services/user-repo/user-repo.service';
import { WebGuard } from './guards/web/web.guard';
import { IntendManagerService } from '../session-manager/services/intend-manager/intend-manager.service';
import { JwtTokenManagerService } from './services/jwt-token-manager/jwt-token-manager.service';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenService } from './strategies/access-token/access-token.service';
import { RefreshTokenService } from './strategies/refresh-token/refresh-token/refresh-token.service';
import { OauthController } from './controllers/oauth/oauth.controller';
import { ClientRepoService } from './services/oauth/client-repo/client-repo.service';
import { AccessTokenRepoService } from './services/oauth/access-token-repo/access-token-repo.service';
import { RefreshTokenRepoService } from './services/oauth/refresh-token-repo/refresh-token-repo.service';
import { AuthorizationLoginStrategy } from './strategies/authorization-login-strategy/authorization-login.strategy';
import { AuthorizationRedirector } from './redirections/authorization/authorization.redirector';
import { AuthorizationChallengeRepoService } from './services/authorization-challenge-repo/authorization-challenge-repo.service';
import { ImplicitPasswordGrantType } from './grant-types/implicit-password/implicit-password.grant-type';
import { ClientIdExistsValidator } from './validators/client-id-exists/client-id-exists.validator';
import { ProofKeyExchangeGrantType } from './grant-types/proof-key-exchage/proof-key-exchange.grant-type';
import { AuthorizationCodeGrantType } from './grant-types/authorization-code/authorization-code.grant-type';
import { AuthorizationController } from './controllers/authorization/authorization.controller';
import { PasswordRedirector } from './redirections/password/password.redirector';
import { RestartLoginRedirector } from './redirectors/restart-login/restart-login.redirector';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtTokenManagerService,
    }),
  ],
  providers: [
    AuthService,
    HashEncryptService,
    UserRepoService,
    WebGuard,
    IntendManagerService,
    JwtTokenManagerService,
    AccessTokenService,
    RefreshTokenService,
    ClientRepoService,
    AccessTokenRepoService,
    RefreshTokenRepoService,
    AuthorizationLoginStrategy,
    AuthorizationRedirector,
    AuthorizationChallengeRepoService,
    ImplicitPasswordGrantType,
    ClientIdExistsValidator,
    ProofKeyExchangeGrantType,
    AuthorizationCodeGrantType,
    PasswordRedirector,
    RestartLoginRedirector,
  ],
  controllers: [OauthController, AuthorizationController],
  exports: [
    AuthService,
    HashEncryptService,
    ClientRepoService,
    AccessTokenRepoService,
    RefreshTokenRepoService,
    AuthorizationChallengeRepoService,
  ],
})
export class AuthModule {}
