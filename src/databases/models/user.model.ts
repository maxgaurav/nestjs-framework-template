import { Column, DataType, Table, Unique } from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { RegisterModel } from '../model-bootstrap/default-connection-models';

@RegisterModel()
@Table({ tableName: 'users' })
export class UserModel extends BaseModel<UserModel> {
  @Unique
  @Column
  public email: string;

  @Column(DataType.STRING)
  public password: string | null;

  public toJSON(): any {
    const content = super.toJSON();
    delete content.password;
    return content;
  }
}
