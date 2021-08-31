import { Global, Module } from '@nestjs/common';
import { AuthService } from './services/auth/auth.service';
import { HashEncryptService } from './services/hash-encrypt/hash-encrypt.service';
import { SessionStrategyService } from './strategies/session-strategy/session-strategy.service';
import { LoginController } from './controllers/login/login.controller';
import { UserRepoService } from '../user/services/user-repo/user-repo.service';
import { ModelBootstrapModule } from '../databases/model-bootstrap/model-bootstrap.module';
import { WebGuard } from './guards/web/web.guard';
import { LoginWebGuard } from './guards/login-web/login-web.guard';
import { IntendManagerService } from '../session-manager/services/intend-manager/intend-manager.service';
import { JwtTokenManagerService } from './services/jwt-token-manager/jwt-token-manager.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AccessTokenService } from './strategies/access-token/access-token.service';
import { RefreshTokenService } from './strategies/refresh-token/refresh-token/refresh-token.service';
import { OauthController } from './controllers/oauth/oauth.controller';
import { ClientRepoService } from './services/oauth/client-repo/client-repo.service';
import { AccessTokenRepoService } from './services/oauth/access-token-repo/access-token-repo.service';
import { RefreshTokenRepoService } from './services/oauth/refresh-token-repo/refresh-token-repo.service';

@Global()
@Module({
  imports: [
    ModelBootstrapModule.register(),
    JwtModule.registerAsync({
      useClass: JwtTokenManagerService,
    }),
  ],
  providers: [
    AuthService,
    HashEncryptService,
    SessionStrategyService,
    UserRepoService,
    WebGuard,
    LoginWebGuard,
    IntendManagerService,
    JwtTokenManagerService,
    AccessTokenService,
    RefreshTokenService,
    ClientRepoService,
    AccessTokenRepoService,
    RefreshTokenRepoService,
  ],
  controllers: [LoginController, OauthController],
  exports: [AuthService, HashEncryptService],
})
export class AuthModule {}
