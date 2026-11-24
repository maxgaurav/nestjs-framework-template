import { Global, Module } from '@nestjs/common';
import { AuthService } from './services/auth/auth.service.js';
import { HashEncryptService } from './services/hash-encrypt/hash-encrypt.service.js';
import { WebGuard } from './guards/web/web.guard.js';
import { IntendManagerService } from '../session-manager/services/intend-manager/intend-manager.service.js';
import { JwtTokenManagerService } from './services/jwt-token-manager/jwt-token-manager.service.js';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenService } from './strategies/access-token/access-token.service.js';
import { RefreshTokenService } from './strategies/refresh-token/refresh-token/refresh-token.service.js';
import { OauthController } from './controllers/oauth/oauth.controller.js';
import { ClientRepoService } from './services/oauth/client-repo/client-repo.service.js';
import { AccessTokenRepoService } from './services/oauth/access-token-repo/access-token-repo.service.js';
import { RefreshTokenRepoService } from './services/oauth/refresh-token-repo/refresh-token-repo.service.js';
import { AuthorizationLoginStrategy } from './strategies/authorization-login-strategy/authorization-login.strategy.js';
import { AuthorizationRedirector } from './redirections/authorization/authorization.redirector.js';
import { AuthorizationChallengeRepoService } from './services/authorization-challenge-repo/authorization-challenge-repo.service.js';
import { ImplicitPasswordGrantType } from './grant-types/implicit-password/implicit-password.grant-type.js';
import { ClientIdExistsValidator } from './validators/client-id-exists/client-id-exists.validator.js';
import { ProofKeyExchangeGrantType } from './grant-types/proof-key-exchage/proof-key-exchange.grant-type.js';
import { AuthorizationCodeGrantType } from './grant-types/authorization-code/authorization-code.grant-type.js';
import { AuthorizationController } from './controllers/authorization/authorization.controller.js';
import { PasswordRedirector } from './redirections/password/password.redirector.js';
import { RestartLoginRedirector } from './redirectors/restart-login/restart-login.redirector.js';

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
