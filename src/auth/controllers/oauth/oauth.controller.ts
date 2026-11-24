import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { LoginAccessTokenGuard } from '../../guards/login-access-token/login-access-token.guard.js';
import { AccessTokenRepoService } from '../../services/oauth/access-token-repo/access-token-repo.service.js';
import { RefreshTokenRepoService } from '../../services/oauth/refresh-token-repo/refresh-token-repo.service.js';
import { TransactionInterceptor } from '../../../transaction-manager/interceptors/transaction/transaction.interceptor.js';
import { AuthUser } from '../../decorators/auth-user.decorator.js';
import { AccessTokenModel } from '../../../databases/models/oauth/access-token.model.js';
import type { GrantTypeResult } from '../../grant-types/grant-type-implementation.js';
import { ReqTransaction } from '../../../transaction-manager/decorators/transaction.decorator.js';
import { Transaction } from 'sequelize';
import { RefreshTokenModel } from '../../../databases/models/oauth/refresh-token.model.js';
import { ConfigService } from '@nestjs/config';
import { JwtConfig } from '../../../environment/environment-types.interface.js';
import { ApiBody, ApiHeader, ApiProperty, ApiResponse } from '@nestjs/swagger';
import { AccessTokenDto } from '../../dtos/access-token.dto.js';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator.js';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service.js';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service.js';

export interface BearerTokenResult {
  expires_at: Date | string | null;
  access_token: string;
  refresh_token: string;
  type: 'Bearer';
}

class BearerTokenResponse implements BearerTokenResult {
  @ApiProperty()
  public access_token!: string;

  @ApiProperty({ nullable: true })
  expires_at!: Date;

  @ApiProperty()
  public refresh_token!: string;

  @ApiProperty()
  public type!: 'Bearer';
}

@Controller('oauth')
export class OauthController {
  constructor(
    private accessTokenRepo: AccessTokenRepoService,
    private refreshTokenRepo: RefreshTokenRepoService,
    private configService: ConfigService,
    protected readonly hashEncrypt: HashEncryptService,
    protected readonly authorizationChallengeRepo: AuthorizationChallengeRepoService,
  ) {}

  /**
   * Login in user by generating tokens
   * @param user
   * @param transaction
   */
  @ApiHeader({
    name: 'accept',
    allowEmptyValue: false,
    required: true,
    schema: {
      type: 'string',
      enum: ['application/json'],
    },
  })
  @ApiBody({ type: AccessTokenDto })
  @ApiResponse({
    type: BearerTokenResponse,
    links: {
      requestBody: {
        $ref: '#/components/schemas/AccessTokenDto',
      },
    },
  })
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(LoginAccessTokenGuard)
  @Post('token')
  @LoggingDecorator({
    messageBefore:
      'Oauth2: Generating access token and refresh token for grant type',
    messageAfter: 'Oauth2: Generated tokens and returning response',
  })
  public async token(
    @AuthUser() grant: GrantTypeResult,
    @ReqTransaction() transaction?: Transaction,
  ): Promise<BearerTokenResult> {
    const accessTokenExpiration = this.accessTokenExpiration();
    const refreshTokenExpiration = this.refreshTokenExpiration();

    const { accessToken, refreshToken } = grant.refreshToken
      ? // refresh_token grant: rotate (the used pair is revoked, a new pair issued)
        await this.refreshTokenRepo.consumeToken(
          grant.refreshToken,
          refreshTokenExpiration,
          accessTokenExpiration,
          transaction,
        )
      : await this.issue(
          grant,
          accessTokenExpiration,
          refreshTokenExpiration,
          transaction,
        );

    return {
      type: 'Bearer',
      access_token: await this.accessTokenRepo.createBearerToken(accessToken),
      refresh_token:
        await this.refreshTokenRepo.createBearerToken(refreshToken),
      expires_at: accessTokenExpiration,
    };
  }

  /**
   * Issues a fresh access + refresh token pair for the client and user
   */
  protected async issue(
    grant: GrantTypeResult,
    accessTokenExpiration: Date | null,
    refreshTokenExpiration: Date | null,
    transaction?: Transaction,
  ): Promise<{
    accessToken: AccessTokenModel;
    refreshToken: RefreshTokenModel;
  }> {
    const accessToken = await this.accessTokenRepo.create(
      grant.client,
      grant.user,
      accessTokenExpiration,
      transaction,
    );
    const refreshToken = await this.refreshTokenRepo.create(
      accessToken,
      refreshTokenExpiration,
      transaction,
    );
    return { accessToken, refreshToken };
  }

  /**
   * Returns access token expiration time
   */
  public accessTokenExpiration(): Date | null {
    const config: JwtConfig = this.configService.getOrThrow<JwtConfig>('jwt');
    if (!config.expirationTimeAccessToken) {
      return null;
    }

    return new Date(Date.now() + config.expirationTimeAccessToken);
  }

  /**
   * Returns refresh token expiration time
   */
  public refreshTokenExpiration(): Date | null {
    const config: JwtConfig = this.configService.getOrThrow<JwtConfig>('jwt');
    if (!config.expirationTimeRefreshToken) {
      return null;
    }

    return new Date(Date.now() + config.expirationTimeRefreshToken);
  }
}
