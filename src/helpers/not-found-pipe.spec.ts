import { firstValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { notFoundPipe } from './not-found-pipe';
import { NotFoundException } from '@nestjs/common';
import { EmptyResultError } from 'sequelize';

describe('not-found-pipe', () => {
  test('should return not found exception when entity not found is thrown', async () => {
    const action = of(true).pipe(
      map(() => {
        throw new EmptyResultError('');
      }),
    );
    let isResolved = false;
    await firstValueFrom(
      action.pipe(notFoundPipe()).pipe(
        catchError((e) => {
          isResolved = e instanceof NotFoundException;
          return of(true);
        }),
      ),
    );

    expect(isResolved).toEqual(true);
  });

  it('should return the exception thrown if not instance of EntityNotFound', async () => {
    const action = of(true).pipe(
      map(() => {
        throw new Error();
      }),
    );
    let isResolved = false;
    await firstValueFrom(
      action.pipe(notFoundPipe()).pipe(
        catchError((e) => {
          isResolved = e instanceof Error;
          return of(true);
        }),
      ),
    );

    expect(isResolved).toEqual(true);
  });
});
