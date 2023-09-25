import { RedirectRouteInterceptor } from './redirect-route.interceptor';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, Injectable, Scope } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { RedirectRouteExecutorInterface } from '../../../interfaces/redirect-route-executor.interface';
import { RedirectGenerator } from '../../decorators/redirect-generator.decorator';
import { firstValueFrom, of } from 'rxjs';

@Injectable({ scope: Scope.TRANSIENT })
class SampleRedirect implements RedirectRouteExecutorInterface {
  public generateUrl(): Promise<string> | string {
    return 'sampleUrl';
  }
}

@Injectable({ scope: Scope.TRANSIENT })
class SampleRedirectPromise implements RedirectRouteExecutorInterface {
  public generateUrl(): Promise<string> | string {
    return Promise.resolve('sampleUrl');
  }
}

describe('RedirectRouteInterceptor', () => {
  let interceptor: RedirectRouteInterceptor;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        RedirectRouteInterceptor,
        SampleRedirect,
        SampleRedirectPromise,
      ],
    }).compile();

    interceptor = module.get<RedirectRouteInterceptor>(
      RedirectRouteInterceptor,
    );
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should call the redirect handler and redirect when generator returns url as string', async () => {
    const request = {};
    const response = {
      redirect: () => '',
    };

    const context: ExecutionContext = {
      getClass: () => 'className',
      getHandler: () => 'handlerName',
      switchToHttp(): HttpArgumentsHost {
        return {
          getRequest: () => request,
          getResponse: () => response,
        } as any;
      },
    } as any;

    const sessionSaveSpy = jest
      .spyOn(interceptor, 'saveSession')
      .mockReturnValue(Promise.resolve(true));

    const reflector = module.get(Reflector);
    const getOverrideAllSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(SampleRedirect);
    const redirectSpy = jest.spyOn(response, 'redirect').mockImplementation();

    expect(
      await firstValueFrom(
        interceptor.intercept(context, {
          handle() {
            return of(true);
          },
        }),
      ),
    ).toEqual(undefined);

    expect(sessionSaveSpy).toHaveBeenCalledWith(request);
    expect(getOverrideAllSpy).toHaveBeenCalledWith(RedirectGenerator, [
      'handlerName',
      'className',
    ]);
    expect(redirectSpy).toHaveBeenCalledWith('sampleUrl');
  });

  it('should call the redirect handler and redirect when generator returns url as Promise of string', async () => {
    const request = {};
    const response = {
      redirect: () => '',
    };

    const context: ExecutionContext = {
      getClass: () => 'className',
      getHandler: () => 'handlerName',
      switchToHttp(): HttpArgumentsHost {
        return {
          getRequest: () => request,
          getResponse: () => response,
        } as any;
      },
    } as any;

    const sessionSaveSpy = jest
      .spyOn(interceptor, 'saveSession')
      .mockReturnValue(Promise.resolve(true));

    const reflector = module.get(Reflector);
    const getOverrideAllSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(SampleRedirectPromise);
    const redirectSpy = jest.spyOn(response, 'redirect').mockImplementation();

    expect(
      await firstValueFrom(
        interceptor.intercept(context, {
          handle() {
            return of(true);
          },
        }),
      ),
    ).toEqual(undefined);

    expect(sessionSaveSpy).toHaveBeenCalledWith(request);
    expect(getOverrideAllSpy).toHaveBeenCalledWith(RedirectGenerator, [
      'handlerName',
      'className',
    ]);
    expect(redirectSpy).toHaveBeenCalledWith('sampleUrl');
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
