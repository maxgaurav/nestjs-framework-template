import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemConfig } from '../../environment/environment-types.interface';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class LoggingService extends ConsoleLogger {
  constructor(
    private configService: ConfigService,
    protected clsService: ClsService,
  ) {
    super();
  }

  public debug(message: any, context?: string) {
    if (this.configService.get<SystemConfig>('system').debug) {
      super.debug(this.generateMessage(message), context);
    }
  }

  public info(message: any, context?: string): void {
    return this.log(message, context);
  }

  public log(message: any, context?: string) {
    super.log(this.generateMessage(message), context);
  }

  public error(message: any, stackOrContext?: string) {
    super.error(
      this.generateMessage(message),
      stackOrContext,
      'ExceptionsHandler',
    );
  }

  public warn(message: any, context?: string) {
    super.warn(this.generateMessage(message), context);
  }

  public generateMessage(message: string): string {
    if (!this.clsService.isActive()) {
      return message;
    }

    return `[${
      this.clsService.get('type') || 'Default'
    }-${this.clsService.getId()}] ${
      typeof message === 'object' ? JSON.stringify(message) : message
    }`;
  }
}
