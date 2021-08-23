import { Test, TestingModule } from '@nestjs/testing';
import { HashEncryptService } from './hash-encrypt.service';

describe('HashEncryptService', () => {
  let service: HashEncryptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HashEncryptService],
    }).compile();

    service = module.get<HashEncryptService>(HashEncryptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
