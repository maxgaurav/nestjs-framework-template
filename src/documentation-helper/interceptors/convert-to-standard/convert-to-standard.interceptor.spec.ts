import { ConvertToStandardInterceptor } from './convert-to-standard-interceptor.service';
import { CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { SequelizePagination } from '../../../interfaces/sequelize-pagination.interface';

describe('ConvertToStandardInterceptor', () => {
  it('should be defined', () => {
    expect(new ConvertToStandardInterceptor()).toBeDefined();
  });

  it('should return converted pagination value', async () => {
    const handler: CallHandler = {
      handle(): Observable<SequelizePagination<number>> {
        return of({
          items: [1, 2, 3],
          itemCount: 5,
          totalPages: 1,
          page: 1,
          totalItems: 3,
        } as SequelizePagination<number>);
      },
    };

    const interceptor = new ConvertToStandardInterceptor();
    expect(await interceptor.intercept({} as any, handler).toPromise()).toEqual(
      expect.objectContaining({
        data: [1, 2, 3],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 5,
          to: 3,
          total: 3,
        },
      }),
    );
  });

  it('should return converted pagination value for more than 1 page', async () => {
    const handler: CallHandler = {
      handle(): Observable<SequelizePagination<any>> {
        return of({
          items: [4, 5, 6],
          itemCount: 3,
          totalPages: 3,
          page: 2,
          totalItems: 7,
        } as SequelizePagination<any>);
      },
    };

    const interceptor = new ConvertToStandardInterceptor();
    expect(await interceptor.intercept({} as any, handler).toPromise()).toEqual(
      expect.objectContaining({
        data: [4, 5, 6],
        meta: {
          current_page: 2,
          from: 4,
          last_page: 3,
          per_page: 3,
          to: 6,
          total: 7,
        },
      }),
    );
  });
});
