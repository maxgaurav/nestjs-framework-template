import { MethodChangeMiddleware } from './method-change.middleware';

describe('MethodChangeMiddleware', () => {
  let middleware: MethodChangeMiddleware;

  beforeEach(() => {
    middleware = new MethodChangeMiddleware();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should override the method if correct override is present', () => {
    const request = { body: { _method: 'put' }, method: 'get' };
    const next = () => ({});
    middleware.use(request as any, {}, next);
    expect(request.method).toEqual('PUT');
  });

  it('should keep original state if body is not present', () => {
    const request = { body: undefined, method: 'get' };
    const next = () => ({});
    middleware.use(request as any, {}, next);
    expect(request.method).toEqual('GET');
  });

  it('should keep original state if body is does not have override set', () => {
    const request = { body: {}, method: 'get' };
    const next = () => ({});
    middleware.use(request as any, {}, next);
    expect(request.method).toEqual('GET');
  });

  it('should keep original state if body override is not string', () => {
    const request = { body: { _method: 1 }, method: 'get' };
    const next = () => ({});
    middleware.use(request as any, {}, next);
    expect(request.method).toEqual('GET');
  });

  it('should keep original state if body override value is not allowed', () => {
    const request = { body: { _method: 'fail' }, method: 'get' };
    const next = () => ({});
    middleware.use(request as any, {}, next);
    expect(request.method).toEqual('GET');
  });
});
