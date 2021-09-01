import { RefreshAccessTokenGuard } from './refresh-access-token.guard';
import {
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

describe('RefreshAccessTokenGuard', () => {
  let guard: RefreshAccessTokenGuard;

  beforeEach(() => {
    guard = new RefreshAccessTokenGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw unprocessable error on receiving unauthorized exception', () => {
    let errorThrown = false;

    try {
      guard.handleRequest(new UnauthorizedException(), true, false, false);
    } catch (err) {
      if (err instanceof UnprocessableEntityException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should throw unprocessable error on receiving unprocessable exception without changes', () => {
    let errorThrown = false;
    const error = new UnprocessableEntityException();
    try {
      guard.handleRequest(error, true, false, false);
    } catch (err) {
      if (err instanceof UnprocessableEntityException && err === error) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should continue to process with normal flow if all things are correct', () => {
    const superHandleSpy = jest
      .spyOn(AuthGuard('refreshToken').prototype, 'handleRequest')
      .mockReturnValueOnce(true);

    expect(guard.handleRequest(false, true, true, true, true)).toEqual(true);
    expect(superHandleSpy).toHaveBeenCalledWith(false, true, true, true, true);
  });
});
