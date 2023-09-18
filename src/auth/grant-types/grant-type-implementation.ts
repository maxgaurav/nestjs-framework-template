import { ClientModel } from '../../databases/models/oauth/client.model';
import { UserModel } from '../../databases/models/user.model';

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
