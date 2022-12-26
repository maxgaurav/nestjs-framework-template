import { RedirectFromLoginFilter } from './redirect-to-login.filter';
import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { IntendManagerService } from '../../services/intend-manager/intend-manager.service';

const DefaultValue = 'will-not-match';
describe('RedirectToLoginFilter', () => {
  let filter: RedirectFromLoginFilter;
  const intendManager: IntendManagerService = {
    getUrl: (value) => value,
    setUrl: (value) => value,
  } as any;

  beforeEach(() => {
    filter = new RedirectFromLoginFilter(intendManager);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should redirect to login route when request is not json/ajax', () => {
    const request = {
      xhr: false,
      accepts: () => DefaultValue,
      method: 'GET',
      url: 'currentUrl',
      session: { save: (value) => value },
    };
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
    const getUrlSpy = jest
      .spyOn(intendManager, 'getUrl')
      .mockReturnValueOnce('currentIntend');
    const setUrlSpy = jest.spyOn(intendManager, 'setUrl').mockImplementation();
    const saveSpy = jest
      .spyOn(request.session, 'save')
      .mockImplementation((callback: () => void) => callback());

    filter.catch(exception, host as any);
    expect(getUrlSpy).not.toHaveBeenCalledWith(request);
    expect(setUrlSpy).toHaveBeenCalledWith(request, request.url);
    expect(redirectSpy).toHaveBeenCalledWith('/');
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should redirect to login route when request is not json/ajax but not set intend url to null when method is post', () => {
    const request = {
      xhr: false,
      accepts: () => DefaultValue,
      method: 'POST',
      url: 'currentUrl',
      session: { save: (value) => value },
    };
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
    const getUrlSpy = jest
      .spyOn(intendManager, 'getUrl')
      .mockReturnValueOnce('currentIntend');
    const setUrlSpy = jest.spyOn(intendManager, 'setUrl').mockImplementation();
    const saveSpy = jest
      .spyOn(request.session, 'save')
      .mockImplementation((callback: () => void) => callback());

    filter.catch(exception, host as any);
    expect(getUrlSpy).not.toHaveBeenCalledWith(request);
    expect(setUrlSpy).toHaveBeenCalledWith(request, null);
    expect(redirectSpy).toHaveBeenCalledWith('/');
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should return json when set to xhr and method is get', () => {
    const request = { xhr: true, accepts: () => DefaultValue };
    const response = {
      status: (value) => value,
      json: (value) => value,
      url: 'url',
      method: 'get',
      session: {},
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
