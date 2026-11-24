import { Test, TestingModule } from '@nestjs/testing';
import { RandomByteGeneratorService } from './random-byte-generator.service.js';
import { Buffer } from 'node:buffer';

describe('RandomByteGeneratorService', () => {
  let service: RandomByteGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RandomByteGeneratorService],
    }).compile();

    service = module.get<RandomByteGeneratorService>(
      RandomByteGeneratorService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Named ESM imports of node built-ins cannot be spied on, so assert the observable result
  it('should generate random bytes of the requested size', () => {
    const result = service.generateRandomByte(50);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toHaveLength(50);
  });

  it('should generate 40 random bytes by default', () => {
    expect(service.generateRandomByte()).toHaveLength(40);
  });

  it('should generate different bytes on each call', () => {
    expect(
      service.generateRandomByte().equals(service.generateRandomByte()),
    ).toBe(false);
  });
});
