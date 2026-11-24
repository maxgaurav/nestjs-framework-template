import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventRegisterCallbackService } from '../../common/services/event-register-callback/event-register-callback.service.js';
import { UrlBuilderService } from '../../url-management/services/url-builder/url-builder.service.js';
import { Model } from 'sequelize';
import { ClientModel } from '../models/oauth/client.model.js';
import { AccessTokenModel } from '../models/oauth/access-token.model.js';
import { RefreshTokenModel } from '../models/oauth/refresh-token.model.js';
import { AuthorizationChallengeModel } from '../models/oauth/authorization-challenge.model.js';
import { UserModel } from '../models/user.model.js';

export const DefaultConnectionModels: (typeof Model & {
  EventEmitter: EventEmitter2;
  EventCallBackService: EventRegisterCallbackService;
  UrlGenerator: UrlBuilderService;
})[] = [
  ClientModel,
  AccessTokenModel,
  RefreshTokenModel,
  AuthorizationChallengeModel,
  UserModel,
] as never;
