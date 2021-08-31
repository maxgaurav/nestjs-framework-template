import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LoginAccessTokenGuard } from '../../guards/login-access-token/login-access-token.guard';
import { AccessTokenRepoService } from '../../services/oauth/access-token-repo/access-token-repo.service';
import { AccessTokenGuard } from '../../guards/access-token/access-token.guard';
import { RefreshTokenRepoService } from '../../services/oauth/refresh-token-repo/refresh-token-repo.service';
import { TransactionInterceptor } from '../../../transaction-manager/interceptors/transaction/transaction.interceptor';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { UserModel } from '../../../databases/models/user.model';
import { ClientModel } from '../../../databases/models/oauth/client.model';
import { ReqTransaction } from '../../../transaction-manager/decorators/transaction/transaction.decorator';
import { Transaction } from 'sequelize';

@Controller('oauth')
export class OauthController {
  constructor(
    private accessTokenRepo: AccessTokenRepoService,
    private refreshTokenRepo: RefreshTokenRepoService,
  ) {}

  @UseInterceptors(TransactionInterceptor)
  @UseGuards(LoginAccessTokenGuard)
  @Post('token')
  public async login(
    @AuthUser() user: { user: UserModel; client: ClientModel },
    @ReqTransaction() transaction?: Transaction,
  ) {
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
    };
  }

  @UseGuards(AccessTokenGuard)
  @Get('test')
  public sample(@Req() request) {
    return request.user;
  }
}
