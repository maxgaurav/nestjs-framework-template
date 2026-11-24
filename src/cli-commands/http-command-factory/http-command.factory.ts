import { DynamicModule, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CommandFactory } from 'nest-commander';
import type { CommanderOptionsType } from 'nest-commander';
import { LoggingService } from '../../services/logging/logging.service.js';

/**
 * Runs nest-commander commands inside a full HTTP application instead of the
 * plain application context `CommandFactory.run` creates.
 *
 * Some commands need HTTP infrastructure: `route:list` reads the Express router,
 * and anything resolving `HttpAdapterHost` expects an adapter. The command module
 * is the same one nest-commander builds, so `@Command` / `@Option` discovery,
 * parsing and error handling are unchanged.
 */
export class HttpCommandFactory extends CommandFactory {
  static async runHttp(
    rootModule: Type | DynamicModule,
    options: Omit<CommanderOptionsType, 'pluginsAvailable'> = {},
  ): Promise<void> {
    const runOptions = this.getOptions(options);
    const commandModule = this.createCommandModule([rootModule], {
      ...runOptions,
      pluginsAvailable: false,
    });

    const app = await NestFactory.create<NestExpressApplication>(
      commandModule,
      { bufferLogs: true },
    );
    app.useLogger(app.get(LoggingService));

    try {
      // init (not listen): routes get registered on the router, no port is opened
      await app.init();
      await this.runApplication(app);
    } finally {
      await app.close();
    }
  }
}
