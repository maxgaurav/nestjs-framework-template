import { NestFactory } from '@nestjs/core';
import { CommandModule, CommandService } from 'nestjs-command';
import { AppModule } from './app.module';

(async () => {
  const app = await NestFactory.create(AppModule);
  await app.init();
  app.select(CommandModule).get(CommandService).exec();
})();
