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

@Module({
  imports: [
    EnvironmentModule,
    DatabasesModule,
    HealthModule,
    DocumentationHelperModule,
    CommonModule.register(),
    TransactionManagerModule.register(),
    CliCommandsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    NotFoundConverterInterceptor,
    ClassSerializerInterceptor,
    LoggingService,
  ],
})
export class AppModule {}
