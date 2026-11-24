import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { DatesMapping } from '../dates-mapping.js';
import { ClientModel } from './client.model.js';
import { UserModel } from '../user.model.js';

@Table({ tableName: 'oauth_access_tokens' })
export class AccessTokenModel extends DatesMapping<AccessTokenModel> {
  @PrimaryKey
  @Column
  declare public id: string;

  @ForeignKey(() => ClientModel)
  @Column
  declare public client_id: string;

  @ForeignKey(() => UserModel)
  @Column(DataType.INTEGER.UNSIGNED)
  declare public user_id: number | null;

  @Column(DataType.DATE)
  declare public expires_at: Date | null;

  // `declare`, not a class field: a field would be re-initialised after Sequelize's
  // constructor and wipe the eager-loaded association
  @BelongsTo(() => ClientModel)
  declare public client: ClientModel | null;

  @BelongsTo(() => UserModel)
  declare public user: UserModel | null;
}
