import { SessionErrorValidationInterceptor } from './session-error-validation.interceptor';
import { firstValueFrom, of } from 'rxjs';

describe('SessionErrorValidationInterceptor', () => {
  let interceptor: SessionErrorValidationInterceptor;

  beforeEach(() => {
    interceptor = new SessionErrorValidationInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should return original value if response is not type of object', async () => {
    const request: any = {
      flash: (value) => value,
    };

    const flashSpy = jest.spyOn(request, 'flash').mockReturnValueOnce([]);

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of(true) };

    expect(
      await firstValueFrom(interceptor.intercept(context as any, next)),
    ).toEqual(true);

    expect(flashSpy).toHaveBeenCalled();
  });

  it('should set empty object when flash message is empty', async () => {
    const request: any = {
      flash: (value) => value,
    };

    const flashSpy = jest.spyOn(request, 'flash').mockReturnValueOnce([]);

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of({}) };

    expect(
      await firstValueFrom(interceptor.intercept(context as any, next)),
    ).toEqual(
      expect.objectContaining({
        _errorBag: { all: [], errors: {} },
      }),
    );

    expect(flashSpy).toHaveBeenCalled();
  });

  it('should map validation errors to error bag when session has errors', async () => {
    const request: any = {
      flash: (value) => value,
    };

    const errors = {
      error: ['error value'],
    };

    const flashSpy = jest
      .spyOn(request, 'flash')
      .mockReturnValueOnce([JSON.stringify(errors)]);

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of({}) };

    expect(
      await firstValueFrom(interceptor.intercept(context as any, next)),
    ).toEqual(
      expect.objectContaining({
        _errorBag: { all: ['error value'], errors },
      }),
    );

    expect(flashSpy).toHaveBeenCalled();
  });
});
