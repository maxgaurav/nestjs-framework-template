import { SessionMapPreviousUrlInterceptor } from './session-map-previous-url-interceptor.service';
import { firstValueFrom, of } from 'rxjs';

describe('SessionIntendedUrlInterceptor', () => {
  let interceptor: SessionMapPreviousUrlInterceptor;

  beforeEach(() => {
    interceptor = new SessionMapPreviousUrlInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should set previous url to null if no value is set and request is not correct state', async () => {
    const request: any = {
      session: {},
      accepts: () => 'json',
      method: 'post',
      xhr: true,
      url: '',
    };

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of(true) };

    await firstValueFrom(interceptor.intercept(context as any, next));
    expect(request).toEqual(
      expect.objectContaining({
        session: expect.objectContaining({
          _previous: { url: null },
        }),
      }),
    );
  });

  it('should set previous url to correct value if all conditions passes', async () => {
    const request: any = {
      session: {},
      accepts: () => 'html',
      method: 'get',
      xhr: false,
      url: 'test',
    };

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of(true) };

    await firstValueFrom(interceptor.intercept(context as any, next));
    expect(request).toEqual(
      expect.objectContaining({
        session: expect.objectContaining({
          _previous: { url: 'test' },
        }),
      }),
    );
  });

  it('should not change previous url when conditions are not met', async () => {
    const request: any = {
      session: { _previous: { url: 'same' } },
      accepts: () => 'json',
      method: 'get',
      xhr: true,
      url: 'test',
    };

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of(true) };

    await firstValueFrom(interceptor.intercept(context as any, next));
    expect(request).toEqual(
      expect.objectContaining({
        session: expect.objectContaining({
          _previous: { url: 'same' },
        }),
      }),
    );
  });
});
