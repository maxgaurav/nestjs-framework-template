import { RedirectRouteInterceptor } from './redirect-route.interceptor';
import { firstValueFrom, of, race, timer } from 'rxjs';
import { map } from 'rxjs/operators';

describe('RedirectRouteInterceptor', () => {
  let interceptor: RedirectRouteInterceptor;

  beforeEach(() => {
    interceptor = new RedirectRouteInterceptor<string, string>(
      (data, content) => `${data}-${content}`,
    );
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should call the redirect handler and redirect', async () => {
    const response = {
      redirect: (value) => value,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => 'concat',
        getResponse: () => response,
      }),
    } as any;
    const next = {
      handle: () => of('value'),
    };

    const redirectSpy = jest.spyOn(response, 'redirect').mockImplementation();

    expect(
      await firstValueFrom(
        race([
          interceptor.intercept(context, next),
          timer(100).pipe(map(() => true)),
        ]),
      ),
    ).toEqual(true);

    expect(redirectSpy).toHaveBeenCalledWith('value-concat');
  });
});
