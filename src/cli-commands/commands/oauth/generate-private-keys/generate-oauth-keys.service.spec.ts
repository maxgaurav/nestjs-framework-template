import { Test, TestingModule } from '@nestjs/testing';
import { GenerateOauthKeysService } from './generate-oauth-keys.service';
import { Logger } from '@nestjs/common';

describe('GenerateJwtKeysService', () => {
  let service: GenerateOauthKeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateOauthKeysService,
        {
          provide: Logger,
          useValue: console,
        },
      ],
    }).compile();

    service = module.get<GenerateOauthKeysService>(GenerateOauthKeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
