import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { LoginAccessTokenGuard } from '../../guards/login-access-token/login-access-token.guard';
import { AccessTokenRepoService } from '../../services/oauth/access-token-repo/access-token-repo.service';
import { RefreshTokenRepoService } from '../../services/oauth/refresh-token-repo/refresh-token-repo.service';
import { TransactionInterceptor } from '../../../transaction-manager/interceptors/transaction/transaction.interceptor';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { UserModel } from '../../../databases/models/user.model';
import { ClientModel } from '../../../databases/models/oauth/client.model';
import { ReqTransaction } from '../../../transaction-manager/decorators/transaction/transaction.decorator';
import { Transaction } from 'sequelize';
import { RefreshAccessTokenGuard } from '../../guards/refresh-access-token/refresh-access-token.guard';
import { RefreshTokenModel } from '../../../databases/models/oauth/refresh-token.model';
import { ConfigService } from '@nestjs/config';
import { JwtConfig } from '../../../environment/interfaces/environment-types.interface';
import * as moment from 'moment';
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiProperty,
  ApiResponse,
} from '@nestjs/swagger';
import { RefreshTokenDto } from '../../dtos/refresh-token/refresh-token.dto';
import { AccessTokenDto } from '../../dtos/access-token/access-token.dto';

export interface BearerTokenResult {
  expires_at: Date | string | null;
  access_token: string;
  refresh_token: string;
  type: 'Bearer';
}

class BearerTokenResponse implements BearerTokenResult {
  @ApiProperty()
  public access_token: string;

  @ApiProperty({ nullable: true })
  expires_at: Date;

  @ApiProperty()
  public refresh_token: string;

  @ApiProperty()
  public type: 'Bearer';
}

@Controller('oauth')
export class OauthController {
  constructor(
    private accessTokenRepo: AccessTokenRepoService,
    private refreshTokenRepo: RefreshTokenRepoService,
    private configService: ConfigService,
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
  public async login(
    @AuthUser() user: { user: UserModel; client: ClientModel },
    @ReqTransaction() transaction?: Transaction,
  ): Promise<BearerTokenResult> {
    const accessTokenExpiration = this.accessTokenExpiration();
    const refreshTokenExpiration = this.refreshTokenExpiration();

    const accessToken = await this.accessTokenRepo.create(
      user.client,
      user.user,
      accessTokenExpiration,
      transaction,
    );
    const refreshToken = await this.refreshTokenRepo.create(
      accessToken,
      refreshTokenExpiration,
      transaction,
    );

    return {
      type: 'Bearer',
      access_token: await this.accessTokenRepo.createBearerToken(accessToken),
      refresh_token: await this.refreshTokenRepo.createBearerToken(
        refreshToken,
      ),
      expires_at: accessTokenExpiration,
    };
  }

  /**
   * Regenerate tokens using refresh token
   * @param currentRefreshToken
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
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({
    type: BearerTokenResponse,
    links: {
      requestBody: {
        $ref: '#/components/schemas/RefreshTokenDot',
      },
    },
  })
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(RefreshAccessTokenGuard)
  @Post('refresh')
  public async refreshAccessToken(
    @AuthUser() currentRefreshToken: RefreshTokenModel,
    @ReqTransaction() transaction?: Transaction,
  ): Promise<BearerTokenResult> {
    const accessTokenExpiration = this.accessTokenExpiration();
    const refreshTokenExpiration = this.refreshTokenExpiration();

    const { accessToken, refreshToken } =
      await this.refreshTokenRepo.consumeToken(
        currentRefreshToken,
        refreshTokenExpiration,
        accessTokenExpiration,
        transaction,
      );

    return {
      type: 'Bearer',
      access_token: await this.accessTokenRepo.createBearerToken(accessToken),
      refresh_token: await this.refreshTokenRepo.createBearerToken(
        refreshToken,
      ),
      expires_at: accessTokenExpiration,
    };
  }

  /**
   * Returns access token expiration time
   */
  public accessTokenExpiration(): Date | null {
    const config: JwtConfig = this.configService.get<JwtConfig>('jwt');
    if (!config.expirationTimeAccessToken) {
      return null;
    }

    return moment()
      .add(config.expirationTimeAccessToken, 'milliseconds')
      .toDate();
  }

  /**
   * Returns refresh token expiration time
   */
  public refreshTokenExpiration(): Date | null {
    const config: JwtConfig = this.configService.get<JwtConfig>('jwt');
    if (!config.expirationTimeRefreshToken) {
      return null;
    }

    return moment()
      .add(config.expirationTimeRefreshToken, 'milliseconds')
      .toDate();
  }
}
