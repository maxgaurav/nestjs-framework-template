import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnvironmentModule } from './environment/environment.module';
import { DatabasesModule } from './databases/databases.module';
import { HealthModule } from './health/health.module';
import { NotFoundConverterInterceptor } from './helpers/interceptors/not-found-converter/not-found-converter.interceptor';
import { DocumentationHelperModule } from './documentation-helper/documentation-helper.module';
import { CommonModule } from './common/common.module';
import { LoggingService } from './services/logging/logging.service';
import { TransactionManagerModule } from './transaction-manager/transaction-manager.module';
import { CliCommandsModule } from './cli-commands/cli-commands.module';
import { MailModule } from './mail/mail.module';
import { ViewEngineModule } from './view-engine/view-engine.module';
import { UrlGeneratorModule } from 'nestjs-url-generator';
import { UrlConfigServiceService } from './services/url-config-service/url-config-service.service';
import { SessionManagerModule } from './session-manager/session-manager.module';

@Module({
  imports: [
    EnvironmentModule,
    DatabasesModule,
    HealthModule,
    DocumentationHelperModule,
    CommonModule.register(),
    TransactionManagerModule.register(),
    CliCommandsModule,
    MailModule,
    ViewEngineModule,
    UrlGeneratorModule.forRootAsync({
      useClass: UrlConfigServiceService,
    }),
    SessionManagerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    NotFoundConverterInterceptor,
    ClassSerializerInterceptor,
    LoggingService,
    UrlConfigServiceService,
  ],
})
export class AppModule {}
