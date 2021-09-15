import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AccessTokenModel } from '../../../../databases/models/oauth/access-token.model';
import { RandomByteGeneratorService } from '../../../../common/services/random-byte-generator/random-byte-generator.service';
import { ClientModel } from '../../../../databases/models/oauth/client.model';
import { Op, Transaction } from 'sequelize';
import { UserModel } from '../../../../databases/models/user.model';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AccessTokenRepoService {
  constructor(
    @InjectModel(AccessTokenModel) public accessToken: typeof AccessTokenModel,
    private randomByteGenerate: RandomByteGeneratorService,
    private jwtService: JwtService,
  ) {}

  /**
   * Finds token by id or fails
   * @param id
   * @param transaction
   */
  public findOrFail(
    id: string,
    transaction?: Transaction,
  ): Promise<AccessTokenModel> {
    return this.accessToken.findByPk(id, {
      transaction,
      rejectOnEmpty: true,
    });
  }

  /**
   * Finds token by id or fails
   * @param id
   * @param transaction
   */
  public findForActiveState(
    id: string,
    transaction?: Transaction,
  ): Promise<AccessTokenModel | null> {
    return this.accessToken
      .findOne({
        where: {
          id,
          [Op.and]: [
            {
              [Op.or]: [
                {
                  expires_at: null,
                },
                {
                  expires_at: {
                    [Op.gte]: new Date(),
                  },
                },
              ],
            },
          ],
        },
        include: [
          {
            model: ClientModel as any,
            where: {
              is_revoked: false,
            },
          },
        ],
        transaction,
      })
      .then((token) => (!!token ? token : null));
  }

  /**
   * Generates new access token record
   * @param client
   * @param user
   * @param expiresAt
   * @param transaction
   */
  public create(
    client: ClientModel,
    user: UserModel | null,
    expiresAt: Date | null = null,
    transaction?: Transaction,
  ): Promise<AccessTokenModel> {
    return this.accessToken
      .build()
      .setAttributes({
        client_id: client.id,
        user_id: !!user ? user.id : null,
        expires_at: expiresAt,
        id: this.randomByteGenerate.generateRandomByte(40).toString('hex'),
      })
      .save({ transaction });
  }

  /**
   * Generate bearer token
   * @param accessToken
   */
  public async createBearerToken(
    accessToken: AccessTokenModel,
  ): Promise<string> {
    return this.jwtService.signAsync(accessToken.id, {
      algorithm: 'HS256',
    });
  }
}
