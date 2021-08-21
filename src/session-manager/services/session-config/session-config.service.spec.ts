import { Test, TestingModule } from '@nestjs/testing';
import { SessionConfigService } from './session-config.service';
import { ConfigService } from '@nestjs/config';

describe('SessionConfigService', () => {
  let service: SessionConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionConfigService,
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get<SessionConfigService>(SessionConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
