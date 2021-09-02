import { Test, TestingModule } from '@nestjs/testing';
import { JwtTokenManagerService } from './jwt-token-manager.service';
import { join } from 'path';
import { promises as fsPromises, constants as fsConstants } from 'fs';
import { Buffer } from 'buffer';

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
    const existsFileSpy = jest
      .spyOn(service, 'createFileIfNotExists')
      .mockReturnValue(Promise.resolve(true));

    expect(await service.publicKey()).toEqual(Buffer.from(content));
    expect(keyPathSpy).toHaveBeenCalledWith('public-key.pem');
    expect(readFileSpy).toHaveBeenCalledWith('/test/public-key.pem');
    expect(existsFileSpy).toHaveBeenCalled();
  });

  it('should return private key content', async () => {
    const keyPathSpy = jest
      .spyOn(service, 'keyPath')
      .mockReturnValue('/test/private-key.pem');
    const content = 'content';
    const readFileSpy = jest
      .spyOn(fsPromises, 'readFile')
      .mockReturnValue(Promise.resolve(Buffer.from(content)));

    const existsFileSpy = jest
      .spyOn(service, 'createFileIfNotExists')
      .mockReturnValue(Promise.resolve(true));

    expect(await service.privateKey()).toEqual(Buffer.from(content));
    expect(keyPathSpy).toHaveBeenCalledWith('private-key.pem');
    expect(readFileSpy).toHaveBeenCalledWith('/test/private-key.pem');
    expect(existsFileSpy).toHaveBeenCalled();
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

  it('should return true if file exists', async () => {
    const accessSpy = jest
      .spyOn(fsPromises, 'access')
      .mockReturnValue(Promise.resolve());

    expect(await service.createFileIfNotExists('test')).toEqual(true);
    expect(accessSpy).toHaveBeenCalledWith('test', fsConstants.F_OK);
  });

  it('should return false and create file if file does not exists', async () => {
    const accessSpy = jest
      .spyOn(fsPromises, 'access')
      .mockReturnValue(Promise.reject());

    const writeSpy = jest
      .spyOn(fsPromises, 'writeFile')
      .mockReturnValue(Promise.resolve());

    expect(await service.createFileIfNotExists('test')).toEqual(false);
    expect(accessSpy).toHaveBeenCalledWith('test', fsConstants.F_OK);
    expect(writeSpy).toHaveBeenCalledWith('test', '');
  });
});
