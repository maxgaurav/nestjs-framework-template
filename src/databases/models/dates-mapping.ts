import { CreatedAt, Model, UpdatedAt } from 'sequelize-typescript';

export abstract class DatesMapping<T extends object> extends Model<T> {
  @CreatedAt
  declare public created_at: Date;

  @UpdatedAt
  declare public updated_at: Date;
}
