import { NestFactory } from '@nestjs/core';
import { CommandModule, CommandService } from 'nestjs-command';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SystemConfig } from './environment/interfaces/environment-types.interface';

(async () => {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  await app.listen(config.get<SystemConfig>('system').port + 1);
  app.select(CommandModule).get(CommandService).exec();
})();
