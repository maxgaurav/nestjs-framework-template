import {
  BelongsTo,
  Column,
  DataType,
  Default,
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
  public id: string;

  @ForeignKey(() => ClientModel)
  @Column
  public client_id: string;

  @ForeignKey(() => UserModel)
  @Column
  public user_id: number | null;

  @Column
  public expires_at: Date | null;

  @BelongsTo(() => ClientModel)
  public client: ClientModel | null;
}
