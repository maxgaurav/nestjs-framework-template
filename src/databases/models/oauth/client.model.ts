import {
  Column,
  DataType,
  PrimaryKey,
  Table,
  Default,
} from 'sequelize-typescript';
import { DatesMapping } from '../dates-mapping';
import { GrantTypes } from '../../../auth/grant-types/grant-type-implementation';

@Table({ tableName: 'oauth_clients' })
export class ClientModel extends DatesMapping<ClientModel> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  public declare id: string;

  @Column
  public name: string;

  @Column
  public secret: string;

  @Column
  public is_revoked: boolean;

  @Column(DataType.STRING)
  public grant_type: GrantTypes;
}
