import { RedirectIfAuthenticatedInterceptor } from './redirect-if-authenticated.interceptor';
import { WebGuard } from '../../guards/web/web.guard';
import { firstValueFrom, of, race, switchMap, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { UnauthorizedException } from '@nestjs/common';

describe('RedirectIfAuthenticatedInterceptor', () => {
  let interceptor: RedirectIfAuthenticatedInterceptor;

  const webGuard: WebGuard = {
    canActivate: (value) => value,
  } as any;

  beforeEach(() => {
    interceptor = new RedirectIfAuthenticatedInterceptor(webGuard);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should allow passing when context returns false', async () => {
    const response = {};
    const canActivateSpy = jest
      .spyOn(webGuard, 'canActivate')
      .mockReturnValueOnce(of(false));
    const context = { switchToHttp: () => ({ getResponse: () => response }) };
    const next = { handle: () => of(true) };

    expect(
      await firstValueFrom(interceptor.intercept(context as any, next)),
    ).toEqual(true);
    expect(canActivateSpy).toHaveBeenCalledWith(context);
  });

  it('should allow passing when context throws unauthorized', async () => {
    const response = {};
    const canActivateSpy = jest
      .spyOn(webGuard, 'canActivate')
      .mockReturnValueOnce(
        of(true).pipe(
          switchMap(() => throwError(() => new UnauthorizedException())),
        ),
      );
    const context = { switchToHttp: () => ({ getResponse: () => response }) };
    const next = { handle: () => of(true) };

    expect(
      await firstValueFrom(interceptor.intercept(context as any, next)),
    ).toEqual(true);
    expect(canActivateSpy).toHaveBeenCalledWith(context);
  });

  it('should propogate error without stopping is error is not unauthorized', async () => {
    const response = {};
    const canActivateSpy = jest
      .spyOn(webGuard, 'canActivate')
      .mockReturnValueOnce(
        of(true).pipe(switchMap(() => throwError(() => new Error()))),
      );
    const context = { switchToHttp: () => ({ getResponse: () => response }) };
    const next = { handle: () => of(true) };
    let errorThrown = false;
    try {
      await firstValueFrom(interceptor.intercept(context as any, next));
    } catch (err) {
      if (err instanceof Error) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
    expect(canActivateSpy).toHaveBeenCalledWith(context);
  });

  it('should call redirect when authentication is mapped', async () => {
    const response = { redirect: (value) => value };
    const context = { switchToHttp: () => ({ getResponse: () => response }) };
    const next = { handle: () => of(true) };

    const canActivateSpy = jest
      .spyOn(webGuard, 'canActivate')
      .mockReturnValueOnce(of(true));

    const redirectSpy = jest.spyOn(response, 'redirect').mockImplementation();

    expect(
      await firstValueFrom(
        race([
          firstValueFrom(interceptor.intercept(context as any, next)),
          timer(100).pipe(map(() => false)),
        ]),
      ),
    ).toEqual(false);
    expect(canActivateSpy).toHaveBeenCalledWith(context);
    expect(redirectSpy).toHaveBeenCalledWith(interceptor.getRedirectUrl());
  });
});
