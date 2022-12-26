import { AccessTokenGuard } from './access-token.guard';
import { AuthService } from '../../services/auth/auth.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserModel } from '../../../databases/models/user.model';
import { firstValueFrom } from 'rxjs';

const AcceptApplicationJson = 'application/json';
describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;

  const authService: AuthService = {
    findUserByToken: (value) => value,
  } as any;

  beforeEach(() => {
    guard = new AccessTokenGuard(authService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return bearer value from header', () => {
    const headers = {
      accept: AcceptApplicationJson,
      authorization: 'Bearer test',
    };

    expect(guard.getBearerToken(headers)).toEqual('test');
  });

  it('should throw not found exception when accept header is not correct', () => {
    const headers = {
      accept: '*/*',
      authorization: 'Bearer test',
    };

    let errorThrown = false;
    try {
      guard.getBearerToken(headers);
    } catch (err) {
      if (err instanceof NotFoundException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should throw unauthorized exception when authorization is not type of string', () => {
    const headers = {
      accept: AcceptApplicationJson,
      authorization: undefined,
    };

    let errorThrown = false;
    try {
      guard.getBearerToken(headers);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should throw unauthorized exception when authorization does not contain bearer content', () => {
    const headers = {
      accept: AcceptApplicationJson,
      authorization: 'test',
    };

    let errorThrown = false;
    try {
      guard.getBearerToken(headers);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should map user to request when found and return true', async () => {
    const request = { headers: { test: 'test' }, user: undefined };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const getBearerSpy = jest
      .spyOn(guard, 'getBearerToken')
      .mockReturnValue('test');
    const user: UserModel = { id: 1 } as any;

    const findTokenSpy = jest
      .spyOn(authService, 'findUserByToken')
      .mockReturnValue(Promise.resolve(user));

    expect(await firstValueFrom(guard.canActivate(context as any))).toEqual(
      true,
    );
    expect(getBearerSpy).toHaveBeenCalledWith(request.headers);
    expect(findTokenSpy).toHaveBeenCalledWith('test');
    expect(request.user).toEqual(user);
  });

  it('should throw unauthorized error when user is null', async () => {
    const request = { headers: { test: 'test' }, user: undefined };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const getBearerSpy = jest
      .spyOn(guard, 'getBearerToken')
      .mockReturnValue('test');

    const findTokenSpy = jest
      .spyOn(authService, 'findUserByToken')
      .mockReturnValue(Promise.resolve(null));

    let errorThrown = false;

    try {
      await firstValueFrom(guard.canActivate(context as any));
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
    expect(getBearerSpy).toHaveBeenCalledWith(request.headers);
    expect(findTokenSpy).toHaveBeenCalledWith('test');
    expect(request.user).toEqual(undefined);
  });
});
