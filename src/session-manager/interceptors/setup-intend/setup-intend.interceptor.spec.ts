import { SetupIntendInterceptor } from './setup-intend.interceptor';
import { IntendManagerService } from '../../services/intend-manager/intend-manager.service';
import { firstValueFrom, of } from 'rxjs';

describe('SetupIntendInterceptor', () => {
  let interceptor: SetupIntendInterceptor;

  const intendManager: IntendManagerService = {
    setupIntend: (value) => value,
  } as any;

  beforeEach(() => {
    interceptor = new SetupIntendInterceptor(intendManager);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should setup intend in session', async () => {
    const request = {
      url: '',
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
    const next = { handle: () => of(true) };

    const setupIntendSpy = jest
      .spyOn(intendManager, 'setupIntend')
      .mockImplementation();

    expect(await firstValueFrom(interceptor.intercept(context, next))).toEqual(
      true,
    );

    expect(setupIntendSpy).toHaveBeenCalledWith(request);
  });
});
