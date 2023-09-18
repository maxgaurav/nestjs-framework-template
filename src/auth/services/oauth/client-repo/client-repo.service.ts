import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClientModel } from '../../../../databases/models/oauth/client.model';
import { Transaction } from 'sequelize';
import { RandomByteGeneratorService } from '../../../../common/services/random-byte-generator/random-byte-generator.service';
import { GrantTypes } from '../../../grant-types/grant-type-implementation';

@Injectable()
export class ClientRepoService {
  constructor(
    @InjectModel(ClientModel) public clientModel: typeof ClientModel,
    private randomByeGenerator: RandomByteGeneratorService,
  ) {}

  /**
   * Finds client by id or fails
   * @param id
   * @param transaction
   */
  public findOrFail(
    id: string,
    transaction?: Transaction,
  ): Promise<ClientModel> {
    return this.clientModel.findByPk(id, { transaction, rejectOnEmpty: true });
  }

  /**
   * Finds client by id or returns null
   * @param id
   * @param transaction
   */
  public async find(
    id: string,
    transaction?: Transaction,
  ): Promise<ClientModel | null> {
    const result = await this.clientModel.findByPk(id, { transaction });
    return result || null;
  }

  /**
   * Finds client for the id and secret
   * @param id
   * @param secret
   * @param transaction
   */
  public async findForIdAndSecret(
    id: string,
    secret: string,
    transaction?: Transaction,
  ): Promise<ClientModel | null> {
    const result = await this.clientModel.findOne({
      where: { id, secret },
      transaction,
    });
    return !!result ? result : null;
  }

  /**
   * Generates new oauth client
   * @param name
   * @param grantType
   * @param transaction
   */
  public async create(
    name: string,
    grantType: GrantTypes,
    transaction?: Transaction,
  ): Promise<ClientModel> {
    return this.clientModel
      .build()
      .setAttributes({
        name,
        secret: this.randomByeGenerator.generateRandomByte(40).toString('hex'),
        grant_type: grantType,
      })
      .save({ transaction });
  }

  /**
   * Revokes the client
   *
   * @param client
   * @param transaction
   */
  public revoke(
    client: ClientModel,
    transaction?: Transaction,
  ): Promise<ClientModel> {
    return client.setAttributes({ is_revoked: false }).save({ transaction });
  }
}
