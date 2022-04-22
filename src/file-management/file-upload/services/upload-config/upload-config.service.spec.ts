import { Test, TestingModule } from '@nestjs/testing';
import { UploadConfigService } from './upload-config.service';
import { ConfigService } from '@nestjs/config';

describe('UploadConfigService', () => {
  let service: UploadConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadConfigService,
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UploadConfigService>(UploadConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
