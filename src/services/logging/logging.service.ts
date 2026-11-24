import { ConsoleLogger, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemConfig } from '../../environment/environment-types.interface.js';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class LoggingService extends ConsoleLogger {
  constructor(
    private configService: ConfigService,
    // The cluster primary has no ClsModule; Nest 12 no longer resolves a missing
    // dependency to undefined unless the parameter itself is marked optional
    @Optional() protected clsService?: ClsService,
  ) {
    super();
  }

  public debug(message: unknown, context?: string) {
    if (this.configService.getOrThrow<SystemConfig>('system').debug) {
      super.debug(this.generateMessage(message), context);
    }
  }

  public info(message: unknown, context?: string): void {
    return this.log(message, context);
  }

  public log(message: unknown, context?: string) {
    super.log(this.generateMessage(message), context);
  }

  public error(message: unknown, stackOrContext?: string) {
    super.error(
      this.generateMessage(message),
      stackOrContext,
      'ExceptionsHandler',
    );
  }

  public warn(message: unknown, context?: string) {
    super.warn(this.generateMessage(message), context);
  }

  public generateMessage(message: unknown): unknown {
    const cls = this.clsService;
    if (!cls?.isActive()) {
      return message;
    }

    return `[${cls.get<string | undefined>('type') || 'Default'}-${cls.getId()}] ${
      typeof message === 'string' ? message : JSON.stringify(message)
    }`;
  }
}
