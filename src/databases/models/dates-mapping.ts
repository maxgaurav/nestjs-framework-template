import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { CreatedAt, Model, UpdatedAt } from 'sequelize-typescript';

export abstract class DatesMapping<T> extends Model<T> {
  @ApiModelProperty()
  @CreatedAt
  public created_at: Date;

  @ApiModelProperty()
  @UpdatedAt
  public updated_at: Date;
}
