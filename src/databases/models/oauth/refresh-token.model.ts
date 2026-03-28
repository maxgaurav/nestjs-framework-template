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
  declare public id: string;

  @ForeignKey(() => AccessTokenModel)
  @Column
  declare public access_token_id: string;

  @Column(DataType.DATE)
  declare public expires_at: Date | null;

  @BelongsTo(() => AccessTokenModel)
  declare public accessToken: AccessTokenModel;
}
