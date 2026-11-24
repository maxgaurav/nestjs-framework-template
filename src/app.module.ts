import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EnvironmentModule } from './environment/environment.module.js';
import { DatabasesModule } from './databases/databases.module.js';
import { HealthModule } from './health/health.module.js';
import { NotFoundConverterInterceptor } from './helpers/interceptors/not-found-converter/not-found-converter.interceptor.js';
import { DocumentationHelperModule } from './documentation-helper/documentation-helper.module.js';
import { CommonModule } from './common/common.module.js';
import { TransactionManagerModule } from './transaction-manager/transaction-manager.module.js';
import { CliCommandsModule } from './cli-commands/cli-commands.module.js';
import { MailModule } from './mail/mail.module.js';
import { ViewEngineModule } from './view-engine/view-engine.module.js';
import { SessionManagerModule } from './session-manager/session-manager.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { PassportModule } from '@nestjs/passport';
import { MethodChangeMiddleware } from './helpers/middlewares/method-change/method-change.middleware.js';
import { ModelBootstrapModule } from './databases/model-bootstrap/model-bootstrap.module.js';
import { FileManagementModule } from './file-management/file-management.module.js';
import { PaginateOverwriteModule } from './paginate-overwrite/paginate-overwrite.module.js';
import { UrlManagementModule } from './url-management/url-management.module.js';
import { ClsModule } from 'nestjs-cls';
import { Request, Response } from 'express';
import { RepositoriesModule } from './repositories/repositories.module.js';

@Module({
  imports: [
    PassportModule.register({
      session: true,
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        saveReq: true,
        setup: (cls, req: Request, res: Response) => {
          const requestId = cls.getId();
          res.setHeader('Request-Id', requestId);
          cls.set('type', 'REQUEST');
        },
        idGenerator: () => crypto.randomUUID(),
        generateId: true,
      },
    }),
    EnvironmentModule,
    DatabasesModule,
    ModelBootstrapModule,
    PaginateOverwriteModule,
    HealthModule,
    DocumentationHelperModule,
    CommonModule,
    TransactionManagerModule,
    CliCommandsModule,
    MailModule,
    ViewEngineModule,
    SessionManagerModule,
    AuthModule,
    UserModule,
    FileManagementModule,
    UrlManagementModule,
    RepositoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    NotFoundConverterInterceptor,
    ClassSerializerInterceptor,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    // Express 5 / path-to-regexp v8: a bare '*' is no longer a valid wildcard
    consumer.apply(MethodChangeMiddleware).forRoutes('{*splat}');
  }
}
