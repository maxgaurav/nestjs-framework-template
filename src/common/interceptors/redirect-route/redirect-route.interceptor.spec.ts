import { RedirectRouteInterceptor } from './redirect-route.interceptor';
import { firstValueFrom, of, race, timer } from 'rxjs';
import { map } from 'rxjs/operators';

describe('RedirectRouteInterceptor', () => {
  let interceptor: RedirectRouteInterceptor;

  beforeEach(() => {
    interceptor = new RedirectRouteInterceptor<string>(
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
    const saveSessionSpy = jest
      .spyOn(interceptor, 'saveSession')
      .mockReturnValue(Promise.resolve(true));

    expect(
      await firstValueFrom(
        race([
          interceptor.intercept(context, next),
          timer(100).pipe(map(() => true)),
        ]),
      ),
    ).toEqual(true);

    expect(redirectSpy).toHaveBeenCalledWith('value-concat');
    expect(saveSessionSpy).toHaveBeenCalledWith('concat');
  });

  it('should resolve promise when session is saved', async () => {
    const request = { session: { save: (value) => value } };

    const saveSpy = jest
      .spyOn(request.session, 'save')
      .mockImplementation((callback: () => void) => {
        callback();
      });

    expect(await interceptor.saveSession(request as any)).toEqual(true);
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should reject promise with session save error', async () => {
    const request = { session: { save: (value) => value } };

    const saveSpy = jest
      .spyOn(request.session, 'save')
      .mockImplementation((callback: (err: string) => void) => {
        callback('error');
      });

    let errorThrown = false;
    try {
      await interceptor.saveSession(request as any);
    } catch (err) {
      if (err === 'error') {
        errorThrown = true;
      }
    }
    expect(errorThrown).toEqual(true);
    expect(saveSpy).toHaveBeenCalled();
  });
});
