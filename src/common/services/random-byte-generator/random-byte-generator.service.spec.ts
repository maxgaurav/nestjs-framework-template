import { Test, TestingModule } from '@nestjs/testing';
import { RandomByteGeneratorService } from './random-byte-generator.service';

describe('RandomByteGeneratorService', () => {
  let service: RandomByteGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RandomByteGeneratorService],
    }).compile();

    service = module.get<RandomByteGeneratorService>(RandomByteGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
