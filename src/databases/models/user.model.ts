import { Column, DataType, Table, Unique } from 'sequelize-typescript';
import { BaseModel } from './base.model';

@Table({ tableName: 'users' })
export class UserModel extends BaseModel<UserModel> {
  @Unique
  @Column
  public email: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public password: string | null;

  public toJSON(): any {
    const content = super.toJSON();
    delete content.password;
    return content;
  }
}
