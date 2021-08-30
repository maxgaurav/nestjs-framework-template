import { DynamicModule, Logger, Module } from '@nestjs/common';
import { EventRegisterCallbackService } from './services/event-register-callback/event-register-callback.service';
import { ProcessMessagingService } from './services/process-messaging/process-messaging.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RandomByteGeneratorService } from './services/random-byte-generator/random-byte-generator.service';

@Module({
  providers: [
    EventRegisterCallbackService,
    ProcessMessagingService,
    RandomByteGeneratorService,
  ],
})
export class CommonModule {
  static register(): DynamicModule {
    return {
      module: CommonModule,
      imports: [
        EventEmitterModule.forRoot({
          wildcard: true,
          delimiter: '.',
        }),
      ],
      providers: [
        EventRegisterCallbackService,
        ProcessMessagingService,
        Logger,
        RandomByteGeneratorService,
      ],
      exports: [
        EventRegisterCallbackService,
        ProcessMessagingService,
        RandomByteGeneratorService,
      ],
      global: true,
    };
  }
}
