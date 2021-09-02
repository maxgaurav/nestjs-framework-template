import { Test, TestingModule } from '@nestjs/testing';
import { HashEncryptService } from './hash-encrypt.service';
import { compare } from 'bcrypt';
import { ConfigService } from '@nestjs/config';

describe('HashEncryptService', () => {
  let service: HashEncryptService;

  const configService: ConfigService = { get: (value) => value } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HashEncryptService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
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

  it('should encrypt content', async () => {
    const secret = '9a3821cd5152199f';
    const text = 'sample';
    const configGetSpy = jest
      .spyOn(configService, 'get')
      .mockReturnValue(secret);
    await service.onApplicationBootstrap();

    const encryptedText = await service.encrypt(text);
    const decryptedText = await service.decrypt(encryptedText);
    expect(decryptedText).toEqual(text);
    expect(configGetSpy).toHaveBeenCalledTimes(2);
  });
});
