import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SequelizePagination } from '../../../interfaces/sequelize-pagination.interface';

interface DefaultPagination {
  data: any[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

@Injectable()
export class ConvertToStandardInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(
        (result: SequelizePagination<any>): DefaultPagination => ({
          data: result.items,
          meta: {
            current_page: parseFloat(result.page.toString()),
            from: this.from(result),
            last_page: result.totalPages,
            per_page: parseFloat(result.itemCount.toString()),
            to: this.to(result),
            total: result.totalItems,
          },
        }),
      ),
    );
  }

  private from(result: any): number {
    return (result.page - 1) * result.itemCount + 1;
  }

  private to(result: any): number {
    return this.from(result) + result.items.length - 1;
  }
}
