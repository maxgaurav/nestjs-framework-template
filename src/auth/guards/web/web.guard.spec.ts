import { Test, TestingModule } from '@nestjs/testing';
import { WebGuard } from './web.guard';
import { AuthService } from '../../services/auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('WebGuard', () => {
  let service: WebGuard;

  const authService: AuthService = { getLoggedInUser: (value) => value } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebGuard,
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    service = module.get<WebGuard>(WebGuard);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return unauthorized when session is not initialized', async () => {
    const request = {};
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };
    let errorThrown = false;

    try {
      await firstValueFrom(service.canActivate(context as any));
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should return unauthorized when session is initialized but auth is not set', async () => {
    const request = { session: {} };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };
    let errorThrown = false;

    try {
      await firstValueFrom(service.canActivate(context as any));
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should return unauthorized when auth is set to false', async () => {
    const request = { session: { auth: { isAuth: false, userId: 12 } } };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };
    let errorThrown = false;

    try {
      await firstValueFrom(service.canActivate(context as any));
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should return unauthorized when auth is set but user is forced set to null', async () => {
    const request = { session: { auth: { isAuth: true, userId: null } } };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };
    let errorThrown = false;

    try {
      await firstValueFrom(service.canActivate(context as any));
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should return true when user is found and request being mapped to user', async () => {
    const request = { session: { auth: { isAuth: true, userId: 1 } } };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    const user = { id: 1 } as any;

    const findUserSpy = jest
      .spyOn(authService, 'getLoggedInUser')
      .mockReturnValueOnce(Promise.resolve(user));

    expect(await firstValueFrom(service.canActivate(context as any))).toEqual(
      true,
    );

    expect(findUserSpy).toHaveBeenCalledWith(request.session.auth.userId);
    expect(request).toEqual(expect.objectContaining({ user }));
  });

  it('should return false when user is not found', async () => {
    const request = {
      session: { auth: { isAuth: true, userId: 1 } },
      user: undefined,
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    const findUserSpy = jest
      .spyOn(authService, 'getLoggedInUser')
      .mockReturnValueOnce(Promise.reject(new NotFoundException()));

    expect(await firstValueFrom(service.canActivate(context as any))).toEqual(
      false,
    );

    expect(findUserSpy).toHaveBeenCalledWith(1);
    expect(request.user).toEqual(undefined);
  });

  it('should return false when user is not found', async () => {
    const request = { session: { auth: { isAuth: true, userId: 1 } } };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    const user = { id: 1 } as any;

    const findUserSpy = jest
      .spyOn(authService, 'getLoggedInUser')
      .mockReturnValueOnce(Promise.resolve(user));

    expect(await firstValueFrom(service.canActivate(context as any))).toEqual(
      true,
    );

    expect(findUserSpy).toHaveBeenCalledWith(request.session.auth.userId);
    expect(request).toEqual(expect.objectContaining({ user }));
  });

  it('should throw default error if find fails with such case', async () => {
    const request = {
      session: { auth: { isAuth: true, userId: 1 } },
      user: undefined,
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    let errorThrown = false;

    const findUserSpy = jest
      .spyOn(authService, 'getLoggedInUser')
      .mockReturnValueOnce(Promise.reject(new Error()));

    try {
      await firstValueFrom(service.canActivate(context as any));
    } catch (err) {
      if (err instanceof Error) {
        errorThrown = true;
      }
    }

    expect(findUserSpy).toHaveBeenCalledWith(request.session.auth.userId);
    expect(request.user).toEqual(undefined);
    expect(errorThrown).toEqual(true);
  });
});
