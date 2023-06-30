import { AutoIncrement, Column, PrimaryKey, Table } from 'sequelize-typescript';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { DatesMapping } from './dates-mapping';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventRegisterCallbackService } from '../../common/services/event-register-callback/event-register-callback.service';
import { UrlGeneratorService } from 'nestjs-url-generator';

@Table({})
export class BaseModel<T> extends DatesMapping<T> {
  public declare static EventEmitter: EventEmitter2;

  public declare static EventCallBackService: EventRegisterCallbackService;

  public declare static UrlGenerator: UrlGeneratorService;

  @ApiModelProperty()
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;
}
