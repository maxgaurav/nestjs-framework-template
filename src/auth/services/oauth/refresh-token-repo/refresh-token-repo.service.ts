import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RefreshTokenModel } from '../../../../databases/models/oauth/refresh-token.model';
import { RandomByteGeneratorService } from '../../../../common/services/random-byte-generator/random-byte-generator.service';
import { JwtService } from '@nestjs/jwt';
import { Transaction } from 'sequelize';
import { AccessTokenModel } from '../../../../databases/models/oauth/access-token.model';
import { AccessTokenRepoService } from '../access-token-repo/access-token-repo.service';
import { Buffer } from 'buffer';
import { LoggingDecorator } from '../../../../common/decorators/logging.decorator';
import { ClientModel } from '../../../../databases/models/oauth/client.model';
import { UserModel } from '../../../../databases/models/user.model';

@Injectable()
export class RefreshTokenRepoService {
  constructor(
    @InjectModel(RefreshTokenModel)
    public refreshToken: typeof RefreshTokenModel,
    private randomByteGenerate: RandomByteGeneratorService,
    private jwtService: JwtService,
    private accessTokenRepo: AccessTokenRepoService,
  ) {}

  /**
   * Finds refresh token or fails
   * @param id
   * @param transaction
   */
  public findOrFail(
    id: string,
    transaction?: Transaction,
  ): Promise<RefreshTokenModel> {
    return this.refreshToken.findByPk(id, {
      transaction,
      rejectOnEmpty: true,
    });
  }

  /**
   * Finds refresh token or return null
   * @param id
   * @param transaction
   */
  public async find(
    id: string,
    transaction?: Transaction,
  ): Promise<RefreshTokenModel | null> {
    const refreshToken = await this.refreshToken.findByPk(id, {
      transaction,
    });
    return !!refreshToken ? refreshToken : null;
  }

  /**
   * Creates new refresh token
   * @param accessToken
   * @param expiresAt
   * @param transaction
   */
  @LoggingDecorator({
    messageBefore: 'Creating refresh token against access token',
  })
  public create(
    accessToken: AccessTokenModel,
    expiresAt: Date | null = null,
    transaction?: Transaction,
  ): Promise<RefreshTokenModel> {
    return this.refreshToken
      .build()
      .setAttributes({
        id: this.randomByteGenerate.generateRandomByte(40).toString('hex'),
        access_token_id: accessToken.id,
        expires_at: expiresAt,
      })
      .save({ transaction });
  }

  /**
   * Consumes current refresh token and generates new refresh and access token.
   * @param refreshToken
   * @param refreshTokenExpiresAt
   * @param accessTokenExpiresAt
   * @param transaction
   */
  public async consumeToken(
    refreshToken: RefreshTokenModel,
    refreshTokenExpiresAt: Date | null = null,
    accessTokenExpiresAt: Date | null = null,
    transaction?: Transaction,
  ): Promise<{
    refreshToken: RefreshTokenModel;
    accessToken: AccessTokenModel;
  }> {
    const currentAccessToken = await refreshToken.$get('accessToken', {
      transaction,
    });

    if (!currentAccessToken) {
      throw new Error('Access token not found');
    }

    const client = (await currentAccessToken.$get('client', {
      transaction,
    })) as ClientModel;
    const user = (await currentAccessToken.$get('user', {
      transaction,
    })) as UserModel;

    return this.accessTokenRepo
      .create(client, user, refreshTokenExpiresAt, transaction)
      .then(async (newAccessToken) => {
        const [result] = await Promise.all([
          this.create(newAccessToken, accessTokenExpiresAt, transaction).then(
            (newRefreshToken) => ({
              refreshToken: newRefreshToken,
              accessToken: newAccessToken,
            }),
          ),
          currentAccessToken.destroy({ transaction }),
        ]);
        return result;
      });
  }

  /**
   * Generate bearer token for refresh token
   * @param refreshToken
   */
  public async createBearerToken(
    refreshToken: RefreshTokenModel,
  ): Promise<string> {
    return this.jwtService.signAsync(Buffer.from(refreshToken.id), {
      algorithm: 'HS256',
    });
  }
}
