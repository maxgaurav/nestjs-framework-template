import { Test, TestingModule } from '@nestjs/testing';
import { GenerateClientService } from './generate-client.service';

describe('GenerateClientService', () => {
  let service: GenerateClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateClientService],
    }).compile();

    service = module.get<GenerateClientService>(GenerateClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
