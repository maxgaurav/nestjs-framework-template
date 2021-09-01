import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClientModel } from '../../../../databases/models/oauth/client.model';
import { Transaction } from 'sequelize';
import { RandomByteGeneratorService } from '../../../../common/services/random-byte-generator/random-byte-generator.service';

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
   * Finds client for the id and secret
   * @param id
   * @param secret
   * @param transaction
   */
  public findForIdAndSecret(
    id: string,
    secret: string,
    transaction?: Transaction,
  ): Promise<ClientModel | null> {
    return this.clientModel
      .findOne({
        where: { id, secret },
        transaction,
      })
      .then((result) => (!!result ? result : null));
  }

  /**
   * Generates new oauth client
   * @param name
   * @param transaction
   */
  public async create(
    name: string,
    transaction?: Transaction,
  ): Promise<ClientModel> {
    return this.clientModel
      .build()
      .setAttributes({
        name,
        secret: this.randomByeGenerator.generateRandomByte(40).toString('hex'),
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
