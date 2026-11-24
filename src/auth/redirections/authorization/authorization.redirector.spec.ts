import { AuthorizationRedirector } from './authorization.redirector.js';

describe('AuthorizationRedirector', () => {
  it('should be defined', () => {
    expect(new AuthorizationRedirector({} as any)).toBeDefined();
  });
});
