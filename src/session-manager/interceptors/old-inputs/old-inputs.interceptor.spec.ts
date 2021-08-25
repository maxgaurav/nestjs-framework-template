import { OldInputsInterceptor } from './old-inputs.interceptor';
import { firstValueFrom, of } from 'rxjs';

describe('OldInputsInterceptor', () => {
  let interceptor: OldInputsInterceptor;

  beforeEach(() => {
    interceptor = new OldInputsInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should  map empty object to _oldInput when flash does not contain any input', async () => {
    const request: any = {
      flash: (value) => value,
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of({}) };

    const flashSpy = jest.spyOn(request, 'flash').mockReturnValueOnce([]);

    expect(
      await firstValueFrom(interceptor.intercept(context as any, next)),
    ).toEqual(
      expect.objectContaining({
        _oldInputs: {},
      }),
    );

    expect(flashSpy).toHaveBeenCalled();
  });

  it('should not map property _oldInput when template value is not an object', async () => {
    const request: any = {
      flash: (value) => value,
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of(true) };

    const flashSpy = jest.spyOn(request, 'flash').mockReturnValueOnce([]);

    expect(
      await firstValueFrom(interceptor.intercept(context as any, next)),
    ).toEqual(true);

    expect(flashSpy).toHaveBeenCalled();
  });

  it('should map correct old inputs to template when found', async () => {
    const request: any = {
      flash: (value) => value,
    };

    const oldInput = { input: true };

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of({}) };

    const flashSpy = jest
      .spyOn(request, 'flash')
      .mockReturnValueOnce([JSON.stringify(oldInput)]);

    expect(
      await firstValueFrom(interceptor.intercept(context as any, next)),
    ).toEqual(
      expect.objectContaining({
        _oldInputs: oldInput,
      }),
    );

    expect(flashSpy).toHaveBeenCalled();
  });

  it('should map correct old inputs to template when found but with incorrect', async () => {
    const request: any = {
      flash: (value) => value,
    };

    const oldInput = 'sample';

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of({}) };

    const flashSpy = jest
      .spyOn(request, 'flash')
      .mockReturnValueOnce([JSON.stringify(oldInput)]);

    expect(
      await firstValueFrom(interceptor.intercept(context as any, next)),
    ).toEqual(
      expect.objectContaining({
        _oldInputs: {},
      }),
    );

    expect(flashSpy).toHaveBeenCalled();
  });

  it('should return template context without mapping old input when template context is not object', async () => {
    const request: any = {
      flash: (value) => value,
    };

    const oldInput = 'sample';

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const next = { handle: () => of(null) };

    const flashSpy = jest
      .spyOn(request, 'flash')
      .mockReturnValueOnce([JSON.stringify(oldInput)]);

    expect(
      await firstValueFrom(interceptor.intercept(context as any, next)),
    ).toEqual(
      expect.not.objectContaining({
        _oldInputs: {},
      }),
    );

    expect(flashSpy).toHaveBeenCalled();
  });
});
