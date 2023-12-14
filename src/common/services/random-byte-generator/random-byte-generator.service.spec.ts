import { Test, TestingModule } from '@nestjs/testing';
import { RandomByteGeneratorService } from './random-byte-generator.service';
import crypto from 'node:crypto';
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

  it('should generate random byte', () => {
    const stringContent = 'sample';

    const randomSpy = jest
      .spyOn(crypto, 'randomBytes')
      .mockReturnValue(Buffer.from(stringContent) as any);
    const result = service.generateRandomByte(50);
    expect(result.toString()).toEqual(stringContent);
    expect(randomSpy).toHaveBeenCalledWith(50);
  });

  it('should generate random byte with default', () => {
    const stringContent = 'sample';

    const randomSpy = jest
      .spyOn(crypto, 'randomBytes')
      .mockReturnValue(Buffer.from(stringContent) as any);
    const result = service.generateRandomByte();
    expect(result.toString()).toEqual(stringContent);
    expect(randomSpy).toHaveBeenCalledWith(40);
  });
});
