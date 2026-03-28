import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { DatesMapping } from '../dates-mapping';
import { ClientModel } from './client.model';
import { UserModel } from '../user.model';

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

  @BelongsTo(() => ClientModel)
  public client: ClientModel | null;

  @BelongsTo(() => UserModel)
  public user: UserModel | null;
}
