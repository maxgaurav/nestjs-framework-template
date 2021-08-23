import { Test, TestingModule } from '@nestjs/testing';
import { HashEncryptService } from './hash-encrypt.service';
import { compare } from 'bcrypt';

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

  it('should hash the value provided', async () => {
    const sample = 'sample';
    const hashedValue = await service.createHash(sample);
    expect(typeof hashedValue).toEqual('string');
    expect(await compare(sample, hashedValue)).toEqual(true);
  });

  it('should return true when hash comparison passes', async () => {
    const sample = 'sample';
    const hashedValue = await service.createHash(sample);
    expect(typeof hashedValue).toEqual('string');
    expect(await service.checkHash(sample, hashedValue)).toEqual(true);
  });
});
