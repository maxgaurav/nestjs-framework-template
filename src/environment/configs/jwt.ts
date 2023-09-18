import { JwtConfig } from '../environment-types.interface';

export const jwtConfig = () => ({
  jwt: {
    expirationTimeAccessToken: 30 * 24 * 60 * 60 * 1000, // time in milliseconds or null
    expirationTimeRefreshToken: 60 * 24 * 60 * 60 * 1000, // time in milliseconds
  } as JwtConfig,
});
