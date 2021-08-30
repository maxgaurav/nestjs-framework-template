import { Test, TestingModule } from '@nestjs/testing';
import { GenerateOauthKeysService } from './generate-oauth-keys.service';

describe('GenerateJwtKeysService', () => {
  let service: GenerateOauthKeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateOauthKeysService],
    }).compile();

    service = module.get<GenerateOauthKeysService>(GenerateOauthKeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
