import { AutoIncrement, Column, PrimaryKey, Table } from 'sequelize-typescript';
import { DatesMapping } from './dates-mapping';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventRegisterCallbackService } from '../../common/services/event-register-callback/event-register-callback.service';
import { UrlBuilderService } from '../../url-management/services/url-builder/url-builder.service';

@Table({})
export class BaseModel<T extends object> extends DatesMapping<T> {
  declare public static EventEmitter: EventEmitter2;

  declare public static EventCallBackService: EventRegisterCallbackService;

  declare public static UrlGenerator: UrlBuilderService;

  @PrimaryKey
  @AutoIncrement
  @Column
  declare public id: number;
}
