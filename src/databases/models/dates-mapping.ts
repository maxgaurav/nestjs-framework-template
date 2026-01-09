import { CreatedAt, Model, UpdatedAt } from 'sequelize-typescript';

export abstract class DatesMapping<T extends object> extends Model<T> {
  @CreatedAt
  public declare created_at: Date;

  @UpdatedAt
  public declare updated_at: Date;
}
