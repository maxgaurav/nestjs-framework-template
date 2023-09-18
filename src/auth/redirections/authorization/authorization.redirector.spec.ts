import { AuthorizationRedirector } from './authorization.redirector';

describe('AuthorizationRedirector', () => {
  it('should be defined', () => {
    expect(new AuthorizationRedirector({} as any)).toBeDefined();
  });
});
