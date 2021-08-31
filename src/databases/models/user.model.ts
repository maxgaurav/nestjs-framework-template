import { Column, Table, Unique } from 'sequelize-typescript';
import { BaseModel } from './base.model';

@Table({ tableName: 'users' })
export class UserModel extends BaseModel<UserModel> {
  @Unique
  @Column
  public email: string;

  @Column
  public password: string | null;

  public toJSON(): any {
    const content = super.toJSON() as Record<keyof UserModel, any>;
    delete content.password;
    return content;
  }
}
