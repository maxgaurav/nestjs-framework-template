import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import {
  getConnectionToken,
  getModelToken,
  SequelizeModule,
} from '@nestjs/sequelize';
import { DefaultConnectionModels } from './default-connection-models.js';
import { Sequelize } from 'sequelize-typescript';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventRegisterCallbackService } from '../../common/services/event-register-callback/event-register-callback.service.js';
import { UrlBuilderService } from '../../url-management/services/url-builder/url-builder.service.js';
// getModelToken/getConnectionToken default to the default connection; the
// constant is internal to @nestjs/sequelize (not in its exports map)
const providers: Provider[] = DefaultConnectionModels.map((model) => ({
  provide: getModelToken(model),
  useFactory: (
    connection: Sequelize,
    eventEmitter: EventEmitter2,
    eventRegisterCallback: EventRegisterCallbackService,
    urlBuilder: UrlBuilderService,
  ) => {
    model.EventEmitter = eventEmitter;
    model.EventCallBackService = eventRegisterCallback;
    model.UrlGenerator = urlBuilder;

    if (!connection) {
      return model;
    }
    return connection.getRepository(model as never);
  },
  inject: [
    getConnectionToken(),
    EventEmitter2,
    EventRegisterCallbackService,
    UrlBuilderService,
  ],
}));

const CustomModelInjectionModule: DynamicModule = {
  module: SequelizeModule,
  providers,
  exports: providers,
};

@Global()
@Module({
  imports: [CustomModelInjectionModule],
  exports: [CustomModelInjectionModule],
})
export class ModelBootstrapModule {}
