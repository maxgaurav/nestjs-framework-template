import { DatesMapping } from '../dates-mapping';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AccessTokenModel } from './access-token.model';
import { RegisterModel } from '../../model-bootstrap/default-connection-models';

@RegisterModel()
@Table({ tableName: 'oauth_refresh_tokens' })
export class RefreshTokenModel extends DatesMapping<RefreshTokenModel> {
  @PrimaryKey
  @Column
  public declare id: string;

  @ForeignKey(() => AccessTokenModel)
  @Column
  public declare access_token_id: string;

  @Column(DataType.DATE)
  public declare expires_at: Date | null;

  @BelongsTo(() => AccessTokenModel)
  public declare accessToken: AccessTokenModel;
}
