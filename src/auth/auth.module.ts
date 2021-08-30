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

@Global()
@Module({
  imports: [
    ModelBootstrapModule.register(),
    JwtModule.registerAsync({
      useClass: JwtTokenManagerService,
      inject: [ConfigModule],
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
  ],
  controllers: [LoginController, OauthController],
  exports: [AuthService, HashEncryptService],
})
export class AuthModule {}
