import { Injectable } from '@nestjs/common';
import { UserModel } from '../../../databases/models/user.model';
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class UserRepoService {
  constructor(@InjectModel(UserModel) public userModel: typeof UserModel) {}
  /**
   * Find by email or returns null when not not found
   * @param email
   * @param transaction
   */
  public findByEmail(
    email: string,
    transaction?: Transaction,
  ): Promise<UserModel | null> {
    return this.userModel
      .findOne({ where: { email }, transaction })
      .then((result) => (!!result ? result : null));
  }

  /**
   * Find user by email or fail
   * @param email
   * @param transaction
   */
  public findByEmailOrFail(
    email: string,
    transaction?: Transaction,
  ): Promise<UserModel> {
    return Promise.resolve({} as any);
  }

  /**
   * Finds the user or fails
   * @param id
   * @param transaction
   */
  public findByIdOrFail(
    id: number,
    transaction?: Transaction,
  ): Promise<UserModel> {
    return this.userModel.findByPk(id, { transaction });
  }
}
