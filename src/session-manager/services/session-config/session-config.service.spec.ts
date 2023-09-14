import { Test, TestingModule } from '@nestjs/testing';
import { SessionConfigService } from './session-config.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('SessionConfigService', () => {
  let service: SessionConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionConfigService,
        Logger,
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get<SessionConfigService>(SessionConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
