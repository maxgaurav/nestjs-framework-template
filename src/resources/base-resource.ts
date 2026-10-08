import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { DateResource } from './date-resource';

export class BaseResource extends DateResource {
  @ApiProperty()
  @Expose()
  public id: number;
}
