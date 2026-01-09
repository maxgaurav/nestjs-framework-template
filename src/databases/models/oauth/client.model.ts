import {
  Column,
  DataType,
  PrimaryKey,
  Table,
  Default,
} from 'sequelize-typescript';
import { DatesMapping } from '../dates-mapping';
import { GrantTypes } from '../../../auth/grant-types/grant-type-implementation';
import { RegisterModel } from '../../model-bootstrap/default-connection-models';

@RegisterModel()
@Table({ tableName: 'oauth_clients' })
export class ClientModel extends DatesMapping<ClientModel> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  public declare id: string;

  @Column
  public declare name: string;

  @Column
  public declare secret: string;

  @Column
  public declare is_revoked: boolean;

  @Column(DataType.STRING)
  public declare grant_type: GrantTypes;
}
