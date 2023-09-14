import { Global, Logger, Module } from '@nestjs/common';
import { EventRegisterCallbackService } from './services/event-register-callback/event-register-callback.service';
import { ProcessMessagingService } from './services/process-messaging/process-messaging.service';
import { RandomByteGeneratorService } from './services/random-byte-generator/random-byte-generator.service';
import { LoggingService } from '../services/logging/logging.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
  ],
  providers: [
    EventRegisterCallbackService,
    ProcessMessagingService,
    RandomByteGeneratorService,
    LoggingService,
    {
      provide: Logger,
      useClass: LoggingService,
    },
  ],
  exports: [
    EventRegisterCallbackService,
    ProcessMessagingService,
    RandomByteGeneratorService,
    {
      provide: Logger,
      useClass: LoggingService,
    },
  ],
})
export class CommonModule {}
