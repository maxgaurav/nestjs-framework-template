import { Test, TestingModule } from '@nestjs/testing';
import { MailConfigService } from './mail-config.service';
import { ConfigService } from '@nestjs/config';

describe('MailConfigService', () => {
  let service: MailConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailConfigService,
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MailConfigService>(MailConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
