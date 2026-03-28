import { DatesMapping } from '../dates-mapping';
import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { UserModel } from '../user.model';
import { ClientModel } from './client.model';

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

  @BelongsTo(() => UserModel)
  public user!: UserModel;

  @BelongsTo(() => ClientModel)
  public client!: ClientModel;
}
