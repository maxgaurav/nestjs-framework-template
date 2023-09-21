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

@Table({ tableName: 'oauth_refresh_tokens' })
export class RefreshTokenModel extends DatesMapping<RefreshTokenModel> {
  @PrimaryKey
  @Column
  public id: string;

  @ForeignKey(() => AccessTokenModel)
  @Column
  public access_token_id: string;

  @Column(DataType.DATE)
  public expires_at: Date | null;

  @BelongsTo(() => AccessTokenModel)
  public accessToken: AccessTokenModel;
}
