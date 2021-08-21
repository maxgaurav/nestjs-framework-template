import { AutoIncrement, Column, PrimaryKey, Table } from 'sequelize-typescript';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { DatesMapping } from './dates-mapping';

@Table({})
export class BaseModel<T> extends DatesMapping<T> {
  @ApiModelProperty()
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;
}
