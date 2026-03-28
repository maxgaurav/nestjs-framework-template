import { Column, DataType, Table, Unique } from 'sequelize-typescript';
import { BaseModel } from './base.model';

@Table({ tableName: 'users' })
export class UserModel extends BaseModel<UserModel> {
  @Unique
  @Column
  declare public email: string;

  @Column(DataType.STRING)
  declare public password: string | null;

  public toJSON(): any {
    const content = super.toJSON() as Partial<UserModel>;
    delete content.password;
    return content;
  }
}
