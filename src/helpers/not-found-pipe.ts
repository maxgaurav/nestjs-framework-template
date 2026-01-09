import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EmptyResultError } from 'sequelize';
import { NotFoundException } from '@nestjs/common';

export const notFoundPipe = <T>() => {
  return (source: Observable<T>) =>
    source.pipe(
      catchError((err: unknown) => {
        if (err instanceof EmptyResultError) {
          return throwError(() => new NotFoundException('Record not found'));
        }
        return throwError(() => err);
      }),
    );
};
