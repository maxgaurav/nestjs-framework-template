import { RedirectToLoginFilter } from './redirect-to-login.filter';
import { HttpStatus, UnauthorizedException } from '@nestjs/common';

describe('RedirectToLoginFilter', () => {
  let filter: RedirectToLoginFilter;

  beforeEach(() => {
    filter = new RedirectToLoginFilter();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should redirect to login route when request is not json/ajax', () => {
    const request = { xhr: false, accepts: () => 'will-not-match' };
    const response = {
      redirect: (value) => value,
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };
    const exception = new UnauthorizedException();

    const redirectSpy = jest.spyOn(response, 'redirect');

    filter.catch(exception, host as any);
    expect(redirectSpy).toHaveBeenCalledWith('/');
  });

  it('should return json when set to xhr', () => {
    const request = { xhr: true, accepts: () => 'will-not-match' };
    const response = {
      status: (value) => value,
      json: (value) => value,
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };
    const exception = new UnauthorizedException();
    const statusSpy = jest.spyOn(response, 'status').mockReturnValue(response);
    const jsonSpy = jest.spyOn(response, 'json');

    filter.catch(exception, host as any);
    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(jsonSpy).toHaveBeenCalledWith({
      errors: { error: [exception.message] },
      message: exception.message,
    });
  });

  it('should return json when set to json', () => {
    const request = { xhr: false, accepts: () => 'json' };
    const response = {
      status: (value) => value,
      json: (value) => value,
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };
    const exception = new UnauthorizedException();
    const statusSpy = jest.spyOn(response, 'status').mockReturnValue(response);
    const jsonSpy = jest.spyOn(response, 'json');

    filter.catch(exception, host as any);
    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(jsonSpy).toHaveBeenCalledWith({
      errors: { error: [exception.message] },
      message: exception.message,
    });
  });
});
