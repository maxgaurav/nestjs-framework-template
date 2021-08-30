import {
  Column,
  DataType,
  Default,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { DatesMapping } from '../dates-mapping';

@Table({ tableName: 'oauth_access_tokens' })
export class AccessTokenModel extends DatesMapping<AccessTokenModel> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  public id: string;
}
