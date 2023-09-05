import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import {
  getConnectionToken,
  getModelToken,
  SequelizeModule,
} from '@nestjs/sequelize';
import { DefaultConnectionModels } from './default-connection-models';
import { DEFAULT_CONNECTION_NAME } from '@nestjs/sequelize/dist/sequelize.constants';
import { Sequelize } from 'sequelize-typescript';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventRegisterCallbackService } from '../../common/services/event-register-callback/event-register-callback.service';
import { EntitiesMetadataStorage } from '@nestjs/sequelize/dist/entities-metadata.storage';

const providers: Provider[] = DefaultConnectionModels.map((model: any) => ({
  provide: getModelToken(model, DEFAULT_CONNECTION_NAME),
  useFactory: (
    connection: Sequelize,
    eventEmitter: EventEmitter2,
    eventRegisterCallback: EventRegisterCallbackService,
  ) => {
    model.EventEmitter = eventEmitter;
    model.EventCallBackService = eventRegisterCallback;
    model.UrlGenerator = {};

    if (!connection) {
      return model;
    }
    return connection.getRepository(model as any);
  },
  inject: [
    getConnectionToken(DEFAULT_CONNECTION_NAME),
    EventEmitter2,
    EventRegisterCallbackService,
  ],
}));

EntitiesMetadataStorage.addEntitiesByConnection(
  DEFAULT_CONNECTION_NAME,
  DefaultConnectionModels,
);

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
