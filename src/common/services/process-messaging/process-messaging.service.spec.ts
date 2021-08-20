import { Test, TestingModule } from '@nestjs/testing';
import { ProcessMessagingService } from './process-messaging.service';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('ProcessMessagingService', () => {
  let service: ProcessMessagingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessMessagingService,
        {
          provide: Logger,
          useValue: console,
        },
        {
          provide: EventEmitter2,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ProcessMessagingService>(ProcessMessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
