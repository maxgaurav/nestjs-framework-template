import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventRegisterCallbackService } from '../../common/services/event-register-callback/event-register-callback.service';
import { UrlBuilderService } from '../../url-management/services/url-builder/url-builder.service';
import { Model } from 'sequelize';
import { ClientModel } from '../models/oauth/client.model';
import { AccessTokenModel } from '../models/oauth/access-token.model';
import { RefreshTokenModel } from '../models/oauth/refresh-token.model';
import { AuthorizationChallengeModel } from '../models/oauth/authorization-challenge.model';
import { UserModel } from '../models/user.model';

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
