import { ClientModel } from '../../databases/models/oauth/client.model.js';
import { UserModel } from '../../databases/models/user.model.js';

export interface GrantTypeImplementation<T = any> {
  validate(payload: T): Promise<{ client: ClientModel; user: UserModel }>;
}

export interface GrantTypeImplementationInstance {
  new (...args: any[]): GrantTypeImplementation;
}

export enum GrantTypes {
  ImplicitPassword = 'password',
  PKCE = 'pkce',
  AuthorizationCode = 'authorization-code',
}
