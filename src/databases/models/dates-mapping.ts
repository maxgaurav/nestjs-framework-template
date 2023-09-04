import { CreatedAt, Model, UpdatedAt } from 'sequelize-typescript';

export abstract class DatesMapping<T> extends Model<T> {
  @CreatedAt
  public created_at: Date;

  @UpdatedAt
  public updated_at: Date;
}
