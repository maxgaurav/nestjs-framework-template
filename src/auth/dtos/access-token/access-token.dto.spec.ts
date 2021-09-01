import { AccessTokenDto } from './access-token.dto';

describe('AccessTokenDto', () => {
  it('should be defined', () => {
    expect(new AccessTokenDto()).toBeDefined();
  });

  it('should set default values on construct', () => {
    const dto = new AccessTokenDto({ email: 'email@email.com' });
    expect(dto.email).toEqual('email@email.com');
  });
});
