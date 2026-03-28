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
  declare public id: string;

  @Column
  declare public name: string;

  @Column
  declare public secret: string;

  @Column
  declare public is_revoked: boolean;

  @Column(DataType.STRING)
  declare public grant_type: GrantTypes;
}
