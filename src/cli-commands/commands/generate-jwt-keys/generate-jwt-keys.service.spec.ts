import { Test, TestingModule } from '@nestjs/testing';
import { GenerateJwtKeysService } from './generate-jwt-keys.service';

describe('GenerateJwtKeysService', () => {
  let service: GenerateJwtKeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateJwtKeysService],
    }).compile();

    service = module.get<GenerateJwtKeysService>(GenerateJwtKeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
