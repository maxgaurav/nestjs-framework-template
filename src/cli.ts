import { NestFactory } from '@nestjs/core';
import { CommandService } from 'nestjs-command';
import { AppModule } from './app.module';
import { LoggingService } from './services/logging/logging.service';
import * as process from 'process';

(async () => {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get<LoggingService>(LoggingService));
  await app.init();
  await app.get(CommandService).exec();
  await app.close();
  process.exit(0);
})();
