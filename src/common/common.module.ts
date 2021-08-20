import { DynamicModule, Logger, Module } from '@nestjs/common';
import { EventRegisterCallbackService } from './services/event-register-callback/event-register-callback.service';
import { ProcessMessagingService } from './services/process-messaging/process-messaging.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  providers: [EventRegisterCallbackService, ProcessMessagingService],
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
      ],
      exports: [EventRegisterCallbackService, ProcessMessagingService],
      global: true,
    };
  }
}
