import { of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { notFoundPipe } from './not-found-pipe';

describe('not-found-pipe', () => {
  test.skip('should return not found exception when entity not found is thrown', async (done) => {
    done();
  });

  it('should return the exception thrown if not instance of EntityNotFound', async () => {
    const action = of(true).pipe(switchMap(() => throwError(new Error())));
    let isResolved = false;
    await action
      .pipe(notFoundPipe())
      .pipe(
        catchError((e) => {
          isResolved = e instanceof Error;
          return of(true);
        }),
      )
      .toPromise();

    expect(isResolved).toEqual(true);
  });
});
