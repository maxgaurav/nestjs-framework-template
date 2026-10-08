import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export abstract class PaginationResource<T> {
  public abstract items: T[];

  @ApiProperty()
  @Expose()
  page: number;

  @ApiProperty()
  @Expose()
  itemCount: number;

  @ApiProperty()
  @Expose()
  totalItems: number;

  @ApiProperty()
  @Expose()
  totalPages: number;

  @ApiProperty()
  @Expose()
  offset: number;
}
