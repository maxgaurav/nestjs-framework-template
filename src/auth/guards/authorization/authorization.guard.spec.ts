import { AuthorizationGuard } from './authorization.guard.js';

describe('AuthorizationGuard', () => {
  it('should be defined', () => {
    expect(new AuthorizationGuard()).toBeDefined();
  });
});
