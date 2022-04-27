import { NestFactory } from '@nestjs/core';
import { CommandModule, CommandService } from 'nestjs-command';
import { AppModule } from './app.module';
import { LoggingService } from './services/logging/logging.service';
import { TinkerService } from './cli-commands/commands/tinker/tinker.service';

(async () => {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get<LoggingService>(LoggingService));
  await app.init();
  app.get(TinkerService).setContext(app);
  app.select(CommandModule).get(CommandService).exec();
})();
