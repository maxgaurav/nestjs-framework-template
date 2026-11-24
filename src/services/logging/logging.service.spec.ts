import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  const configService = {
    getOrThrow: () => ({ debug: true }),
  } as unknown as ConfigService;

  it('resolves without ClsService (cluster primary has no ClsModule)', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    const service = module.get(LoggingService);
    expect(service.generateMessage('plain')).toEqual('plain');
  });

  it('prefixes messages with the CLS type and id inside an active context', async () => {
    const clsService = {
      isActive: () => true,
      get: () => 'COMMAND',
      getId: () => 'abc',
    } as unknown as ClsService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingService,
        { provide: ConfigService, useValue: configService },
        { provide: ClsService, useValue: clsService },
      ],
    }).compile();

    const service = module.get(LoggingService);
    expect(service.generateMessage('hello')).toEqual('[COMMAND-abc] hello');
    expect(service.generateMessage({ a: 1 })).toEqual('[COMMAND-abc] {"a":1}');
  });
});
