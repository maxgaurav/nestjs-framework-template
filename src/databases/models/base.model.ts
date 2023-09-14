import { AutoIncrement, Column, PrimaryKey, Table } from 'sequelize-typescript';
import { DatesMapping } from './dates-mapping';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventRegisterCallbackService } from '../../common/services/event-register-callback/event-register-callback.service';
import { UrlBuilderService } from '../../url-management/services/url-builder/url-builder.service';

@Table({})
export class BaseModel<T> extends DatesMapping<T> {
  public declare static EventEmitter: EventEmitter2;

  public declare static EventCallBackService: EventRegisterCallbackService;

  public declare static UrlGenerator: UrlBuilderService;

  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;
}
