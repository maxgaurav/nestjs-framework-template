import { LoginAccessTokenGuard } from './login-access-token.guard';

describe('LoginAccessTokenGuard', () => {
  it('should be defined', () => {
    expect(new LoginAccessTokenGuard()).toBeDefined();
  });
});
