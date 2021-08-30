import { Test, TestingModule } from '@nestjs/testing';
import { ClientRepoService } from './client-repo.service';

describe('ClientRepoService', () => {
  let service: ClientRepoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientRepoService],
    }).compile();

    service = module.get<ClientRepoService>(ClientRepoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
