import { ClientModel } from '../../databases/models/oauth/client.model.js';
import { UserModel } from '../../databases/models/user.model.js';
import type { RefreshTokenModel } from '../../databases/models/oauth/refresh-token.model.js';

export interface GrantTypeResult {
  client: ClientModel;
  user: UserModel;
  /** Set by the refresh_token grant: the token to rotate instead of issuing a fresh pair */
  refreshToken?: RefreshTokenModel;
}

export interface GrantTypeImplementation<T = any> {
  validate(payload: T): Promise<GrantTypeResult>;
}

export interface GrantTypeImplementationInstance {
  new (...args: any[]): GrantTypeImplementation;
}

export enum GrantTypes {
  ImplicitPassword = 'password',
  PKCE = 'pkce',
  AuthorizationCode = 'authorization-code',
  /** RFC 6749 §6: exchange a refresh token for a new token pair */
  RefreshToken = 'refresh_token',
}
