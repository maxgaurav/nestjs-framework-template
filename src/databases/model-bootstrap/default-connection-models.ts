import { UserModel } from '../models/user.model';
import { AccessTokenModel } from '../models/oauth/access-token.model';
import { RefreshTokenModel } from '../models/oauth/refresh-token.model';
import { ClientModel } from '../models/oauth/client.model';

export const DefaultConnectionModels = [
  UserModel,
  ClientModel,
  AccessTokenModel,
  RefreshTokenModel,
];
