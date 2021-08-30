import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenRepoService } from './access-token-repo.service';

describe('AccessTokenRepoService', () => {
  let service: AccessTokenRepoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessTokenRepoService],
    }).compile();

    service = module.get<AccessTokenRepoService>(AccessTokenRepoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
