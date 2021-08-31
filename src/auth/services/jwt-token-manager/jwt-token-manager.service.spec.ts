import { Test, TestingModule } from '@nestjs/testing';
import { JwtTokenManagerService } from './jwt-token-manager.service';
import { join } from 'path';
import { promises as fsPromises } from 'fs';

describe('JwtTokenManagerService', () => {
  let service: JwtTokenManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtTokenManagerService],
    }).compile();

    service = module.get<JwtTokenManagerService>(JwtTokenManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct key path', () => {
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/test');
    expect(service.keyPath('test.pem')).toEqual(
      join('/test', 'storage', 'test.pem'),
    );
    expect(cwdSpy).toHaveBeenCalled();
  });

  it('should return public key content', async () => {
    const keyPathSpy = jest
      .spyOn(service, 'keyPath')
      .mockReturnValue('/test/public-key.pem');
    const content = 'content';
    const readFileSpy = jest
      .spyOn(fsPromises, 'readFile')
      .mockReturnValue(Promise.resolve(Buffer.from(content)));

    expect(await service.publicKey()).toEqual(Buffer.from(content));
    expect(keyPathSpy).toHaveBeenCalledWith('public-key.pem');
    expect(readFileSpy).toHaveBeenCalledWith('/test/public-key.pem');
  });

  it('should return private key content', async () => {
    const keyPathSpy = jest
      .spyOn(service, 'keyPath')
      .mockReturnValue('/test/private-key.pem');
    const content = 'content';
    const readFileSpy = jest
      .spyOn(fsPromises, 'readFile')
      .mockReturnValue(Promise.resolve(Buffer.from(content)));

    expect(await service.privateKey()).toEqual(Buffer.from(content));
    expect(keyPathSpy).toHaveBeenCalledWith('private-key.pem');
    expect(readFileSpy).toHaveBeenCalledWith('/test/private-key.pem');
  });

  it('should return correct jwt options', async () => {
    const content = 'content';
    const publicKeySpy = jest
      .spyOn(service, 'publicKey')
      .mockReturnValue(Promise.resolve(Buffer.from(content)));

    const privateKeySpy = jest
      .spyOn(service, 'privateKey')
      .mockReturnValue(Promise.resolve(Buffer.from(content)));

    expect(await service.createJwtOptions()).toEqual({
      privateKey: Buffer.from(content),
      publicKey: Buffer.from(content),
    });

    expect(privateKeySpy).toHaveBeenCalled();
    expect(publicKeySpy).toHaveBeenCalled();
  });
});
