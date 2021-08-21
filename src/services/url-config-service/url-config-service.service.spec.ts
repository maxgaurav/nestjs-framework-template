import { Test, TestingModule } from '@nestjs/testing';
import { UrlConfigServiceService } from './url-config-service.service';
import { ConfigService } from '@nestjs/config';

describe('UrlConfigServiceService', () => {
  let service: UrlConfigServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlConfigServiceService,
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UrlConfigServiceService>(UrlConfigServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
