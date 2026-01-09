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
import { RegisterModel } from '../../model-bootstrap/default-connection-models';

@RegisterModel()
@Table({ tableName: 'oauth_authorization_challenges' })
export class AuthorizationChallengeModel extends DatesMapping<AuthorizationChallengeModel> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  public declare id: string;

  @ForeignKey(() => UserModel)
  @Column
  public declare user_id: number;

  @Column
  public declare challenge: string;

  @Column
  public declare algorithm: string;

  @ForeignKey(() => ClientModel)
  @Column
  public declare client_id: string;

  @BelongsTo(() => UserModel)
  public user!: UserModel;

  @BelongsTo(() => ClientModel)
  public client!: ClientModel;
}
