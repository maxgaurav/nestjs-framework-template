import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RefreshTokenModel } from '../../../../databases/models/oauth/refresh-token.model';
import { RandomByteGeneratorService } from '../../../../common/services/random-byte-generator/random-byte-generator.service';
import { JwtService } from '@nestjs/jwt';
import { Transaction } from 'sequelize';
import { AccessTokenModel } from '../../../../databases/models/oauth/access-token.model';
import { AccessTokenRepoService } from '../access-token-repo/access-token-repo.service';

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
   * Creates new refresh token
   * @param accessToken
   * @param expiresAt
   * @param transaction
   */
  public async create(
    accessToken: AccessTokenModel,
    expiresAt: Date | null = null,
    transaction?: Transaction,
  ): Promise<RefreshTokenModel> {
    return this.refreshToken
      .build()
      .setAttributes({
        id: await this.randomByteGenerate
          .generateRandomByte(40)
          .toString('hex'),
        access_token_id: accessToken.id,
        expires_at: expiresAt,
      })
      .save({ transaction });
  }

  /**
   * Consumes current refresh token and generates new refresh and access token.
   * @param refreshToken
   * @param transaction
   */
  public async consumeToken(
    refreshToken: RefreshTokenModel,
    transaction?: Transaction,
  ): Promise<{
    refreshToken: RefreshTokenModel;
    accessToken: AccessTokenModel;
  }> {
    const currentAccessToken = await refreshToken.$get('accessToken', {
      transaction,
    });
    const client = await currentAccessToken.$get('client', { transaction });
    const user = await currentAccessToken.$get('user', { transaction });

    return this.accessTokenRepo
      .create(client, user, null, transaction)
      .then((newAccessToken) => {
        return Promise.all([
          this.create(newAccessToken, null, transaction).then(
            (newRefreshToken) => ({
              refreshToken: newRefreshToken,
              accessToken: newAccessToken,
            }),
          ),
          currentAccessToken.destroy({ transaction }),
        ]).then(([result]) => result);
      });
  }

  /**
   * Generate bearer token for refresh token
   * @param refreshToken
   */
  public async createBearerToken(
    refreshToken: RefreshTokenModel,
  ): Promise<string> {
    return this.jwtService.signAsync(refreshToken.id, {
      algorithm: 'HS256',
    });
  }
}
