import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnvironmentModule } from './environment/environment.module';
import { DatabasesModule } from './databases/databases.module';
import { HealthModule } from './health/health.module';
import { NotFoundConverterInterceptor } from './helpers/interceptors/not-found-converter/not-found-converter.interceptor';
import { DocumentationHelperModule } from './documentation-helper/documentation-helper.module';
import { CommonModule } from './common/common.module';
import { TransactionManagerModule } from './transaction-manager/transaction-manager.module';
import { CliCommandsModule } from './cli-commands/cli-commands.module';
import { MailModule } from './mail/mail.module';
import { ViewEngineModule } from './view-engine/view-engine.module';
import { SessionManagerModule } from './session-manager/session-manager.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PassportModule } from '@nestjs/passport';
import { MethodChangeMiddleware } from './helpers/middlewares/method-change/method-change.middleware';
import { ModelBootstrapModule } from './databases/model-bootstrap/model-bootstrap.module';
import { FileManagementModule } from './file-management/file-management.module';
import { PaginateOverwriteModule } from './paginate-overwrite/paginate-overwrite.module';
import { UrlManagementModule } from './url-management/url-management.module';
import { ClsModule } from 'nestjs-cls';
import { Request, Response } from 'express';

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
    consumer.apply(MethodChangeMiddleware).forRoutes('*');
  }
}
