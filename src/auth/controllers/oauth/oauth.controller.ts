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

export interface BearerTokenResult {
  expires_in: string | null;
  access_token: string;
  refresh_token: string;
  type: 'Bearer';
}

@Controller('oauth')
export class OauthController {
  constructor(
    private accessTokenRepo: AccessTokenRepoService,
    private refreshTokenRepo: RefreshTokenRepoService,
  ) {}

  /**
   * Login in user by generating tokens
   * @param user
   * @param transaction
   */
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(LoginAccessTokenGuard)
  @Post('token')
  public async login(
    @AuthUser() user: { user: UserModel; client: ClientModel },
    @ReqTransaction() transaction?: Transaction,
  ): Promise<BearerTokenResult> {
    const accessToken = await this.accessTokenRepo.create(
      user.client,
      user.user,
      null,
      transaction,
    );
    const refreshToken = await this.refreshTokenRepo.create(
      accessToken,
      null,
      transaction,
    );

    return {
      type: 'Bearer',
      access_token: await this.accessTokenRepo.createBearerToken(accessToken),
      refresh_token: await this.refreshTokenRepo.createBearerToken(
        refreshToken,
      ),
      expires_in: null,
    };
  }

  /**
   * Regenerate tokens using refresh token
   * @param currentRefreshToken
   * @param transaction
   */
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(RefreshAccessTokenGuard)
  @Post('refresh')
  public async refreshAccessToken(
    @AuthUser() currentRefreshToken: RefreshTokenModel,
    @ReqTransaction() transaction?: Transaction,
  ): Promise<BearerTokenResult> {
    const { accessToken, refreshToken } =
      await this.refreshTokenRepo.consumeToken(
        currentRefreshToken,
        transaction,
      );

    return {
      type: 'Bearer',
      access_token: await this.accessTokenRepo.createBearerToken(accessToken),
      refresh_token: await this.refreshTokenRepo.createBearerToken(
        refreshToken,
      ),
      expires_in: null,
    };
  }
}
