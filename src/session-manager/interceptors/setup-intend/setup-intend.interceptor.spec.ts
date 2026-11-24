import { SetupIntendInterceptor } from './setup-intend.interceptor.js';
import { IntendManagerService } from '../../services/intend-manager/intend-manager.service.js';
import { firstValueFrom, of } from 'rxjs';

describe('SetupIntendInterceptor', () => {
  let interceptor: SetupIntendInterceptor;

  const intendManager: IntendManagerService = {
    setupIntend: (value: any) => value,
  } as any;

  beforeEach(() => {
    interceptor = new SetupIntendInterceptor(intendManager);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should setup intend in session', async () => {
    // A web request: the session middleware has attached a session
    const request = {
      url: '',
      session: {},
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
    const next = { handle: () => of(true) };

    const setupIntendSpy = vi
      .spyOn(intendManager, 'setupIntend')
      .mockImplementation(() => undefined);

    expect(await firstValueFrom(interceptor.intercept(context, next))).toEqual(
      true,
    );

    expect(setupIntendSpy).toHaveBeenCalledWith(request);
  });

  it('should skip stateless requests that have no session', async () => {
    const request = { url: '/api/v1/users' };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
    const next = { handle: () => of(true) };
    const setupIntendSpy = vi.spyOn(intendManager, 'setupIntend');

    expect(await firstValueFrom(interceptor.intercept(context, next))).toEqual(
      true,
    );
    expect(setupIntendSpy).not.toHaveBeenCalled();
  });
});
