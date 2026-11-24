import { DatesMapping } from '../dates-mapping.js';
import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { UserModel } from '../user.model.js';
import { ClientModel } from './client.model.js';

@Table({ tableName: 'oauth_authorization_challenges' })
export class AuthorizationChallengeModel extends DatesMapping<AuthorizationChallengeModel> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  declare public id: string;

  @ForeignKey(() => UserModel)
  @Column
  declare public user_id: number;

  @Column
  declare public challenge: string;

  @Column
  declare public algorithm: string;

  @ForeignKey(() => ClientModel)
  @Column
  declare public client_id: string;

  // `declare`, not class fields: a field is re-initialised after Sequelize's constructor and
  // wipes the eager-loaded association
  @BelongsTo(() => UserModel)
  declare public user: UserModel;

  @BelongsTo(() => ClientModel)
  declare public client: ClientModel;
}
