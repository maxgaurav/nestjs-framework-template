import { Test, TestingModule } from '@nestjs/testing';
import { HashEncryptService } from './hash-encrypt.service';
import { compare } from 'bcrypt';
import { ConfigService } from '@nestjs/config';

describe('HashEncryptService', () => {
  let service: HashEncryptService;

  const configService: ConfigService = {
    get: (value) => value,
    getOrThrow: (value) => value,
  } as any;

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
    const configGetOrThrowSpy = vi
      .spyOn(configService, 'getOrThrow')
      .mockReturnValue({
        secret: 'app-secret',
        encryptHexKey: '9a3821cd5152199f',
      });
    await service.onApplicationBootstrap();

    const encryptedText = await service.encrypt('sample');
    expect(encryptedText).not.toEqual('sample');
    expect(await service.decrypt(encryptedText)).toEqual('sample');
    expect(configGetOrThrowSpy).toHaveBeenCalledWith('system');
  });
});
