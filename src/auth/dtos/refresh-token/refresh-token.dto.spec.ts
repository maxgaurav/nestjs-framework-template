import { RefreshTokenDto } from './refresh-token.dto';

describe('RefreshTokenDto', () => {
  it('should be defined', () => {
    expect(new RefreshTokenDto()).toBeDefined();
  });

  it('should set default values on construct', () => {
    const dto = new RefreshTokenDto({ refresh_token: 'token' });
    expect(dto.refresh_token).toEqual('token');
  });
});
