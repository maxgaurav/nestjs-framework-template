import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemConfig } from '../../environment/interfaces/environment-types.interface';

@Injectable()
export class LoggingService extends ConsoleLogger {
  constructor(private configService: ConfigService) {
    super();
  }

  public debug(message: any, context?: string) {
    if (this.configService.get<SystemConfig>('system').debug) {
      super.debug(message, context);
    }
  }
}
