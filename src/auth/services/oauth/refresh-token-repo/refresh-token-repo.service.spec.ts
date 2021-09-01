import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenRepoService } from './refresh-token-repo.service';
import { RefreshTokenModel } from '../../../../databases/models/oauth/refresh-token.model';
import { AccessTokenRepoService } from '../access-token-repo/access-token-repo.service';
import { JwtService } from '@nestjs/jwt';
import { RandomByteGeneratorService } from '../../../../common/services/random-byte-generator/random-byte-generator.service';
import { getModelToken } from '@nestjs/sequelize';
import { AccessTokenModel } from '../../../../databases/models/oauth/access-token.model';
import { ClientModel } from '../../../../databases/models/oauth/client.model';
import { UserModel } from '../../../../databases/models/user.model';

describe('RefreshTokenRepoService', () => {
  let service: RefreshTokenRepoService;

  const model: typeof RefreshTokenModel = {
    findByPk: (value) => value,
    build: (value) => value,
  } as any;
  const accessTokenRepo: AccessTokenRepoService = {
    create: (value) => value,
  } as any;
  const jwtService: JwtService = {
    signAsync: (value) => value,
  } as any;
  const randomByteGenerate: RandomByteGeneratorService = {
    generateRandomByte: (value) => value,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenRepoService,
        {
          provide: getModelToken(RefreshTokenModel),
          useValue: model,
        },
        {
          provide: AccessTokenRepoService,
          useValue: accessTokenRepo,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: RandomByteGeneratorService,
          useValue: randomByteGenerate,
        },
      ],
    }).compile();

    service = module.get<RefreshTokenRepoService>(RefreshTokenRepoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create bearer token', async () => {
    const testContent = 'testContent';
    const signSpy = jest
      .spyOn(jwtService, 'signAsync')
      .mockReturnValue(Promise.resolve(testContent));

    const refreshToken: RefreshTokenModel = { id: 'test' } as any;

    expect(await service.createBearerToken(refreshToken)).toEqual(testContent);
    expect(signSpy).toHaveBeenCalledWith(refreshToken.id, {
      algorithm: 'HS256',
    });
  });

  it('should find or fail', async () => {
    const token: RefreshTokenModel = { id: 'test' } as any;
    const findSpy = jest
      .spyOn(model, 'findByPk')
      .mockReturnValue(Promise.resolve(token));
    const transaction = null;
    expect(await service.findOrFail('test', transaction)).toEqual(token);
    expect(findSpy).toHaveBeenCalledWith('test', {
      transaction,
      rejectOnEmpty: true,
    });
  });

  it('should create new refresh token', async () => {
    const refreshToken: RefreshTokenModel = {
      id: 'test',
      setAttributes: (value) => value,
      save: (value) => value,
    } as any;

    const buildSpy = jest.spyOn(model, 'build').mockReturnValue(refreshToken);

    const content = 'content';
    const generateSpy = jest
      .spyOn(randomByteGenerate, 'generateRandomByte')
      .mockReturnValue(Buffer.from(content));

    const setAttributesSpy = jest
      .spyOn(refreshToken, 'setAttributes')
      .mockReturnValue(refreshToken);
    const saveSpy = jest
      .spyOn(refreshToken, 'save')
      .mockReturnValue(Promise.resolve(refreshToken));

    const accessToken: AccessTokenModel = { id: 'test' } as any;
    const expiresAt = new Date();
    const transaction = null;

    expect(await service.create(accessToken, expiresAt, transaction)).toEqual(
      refreshToken,
    );
    expect(buildSpy).toHaveBeenCalled();
    expect(setAttributesSpy).toHaveBeenCalledWith({
      id: Buffer.from(content).toString('hex'),
      access_token_id: accessToken.id,
      expires_at: expiresAt,
    });
    expect(generateSpy).toHaveBeenCalledWith(40);
    expect(saveSpy).toHaveBeenCalledWith({ transaction });
  });

  it('should consume refresh token and generate new access and refresh token', async () => {
    const refreshToken: RefreshTokenModel = {
      id: 1,
      $get: (value) => value,
    } as any;

    const currentAccessToken: AccessTokenModel = {
      id: 'current',
      $get: (value) => value,
      destroy: (value) => value,
    } as any;

    const mappedUser: UserModel = { id: 1 } as any;

    const currentRefreshTokenGetSpy = jest
      .spyOn(refreshToken, '$get')
      .mockReturnValue(Promise.resolve(currentAccessToken));

    const client: ClientModel = { id: 'client' } as any;

    const currentAccessTokenGetSpy = jest
      .spyOn(currentAccessToken, '$get')
      .mockImplementation((type: string) => {
        if (type === 'user') {
          return Promise.resolve(mappedUser);
        }

        if (type === 'client') {
          return Promise.resolve(client);
        }

        Promise.reject(new Error(`incorrect type injected: ${type}`));
      });

    const currentAccessTokenDestroySpy = jest
      .spyOn(currentAccessToken, 'destroy')
      .mockReturnValue(Promise.resolve());

    const newAccessToken: AccessTokenModel = {
      id: 'new',
    } as any;

    const createAccessTokenSpy = jest
      .spyOn(accessTokenRepo, 'create')
      .mockReturnValue(Promise.resolve(newAccessToken));

    const newRefreshToken: RefreshTokenModel = { id: 'new' } as any;

    const createRefreshTokenSpy = jest
      .spyOn(service, 'create')
      .mockReturnValue(Promise.resolve(newRefreshToken));

    const transaction = null;

    expect(await service.consumeToken(refreshToken, transaction)).toEqual({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    expect(currentRefreshTokenGetSpy).toHaveBeenCalledWith('accessToken', {
      transaction,
    });
    expect(currentAccessTokenGetSpy).toHaveBeenCalledTimes(2);
    expect(currentAccessTokenGetSpy).toHaveBeenNthCalledWith(1, 'client', {
      transaction,
    });
    expect(currentAccessTokenGetSpy).toHaveBeenNthCalledWith(2, 'user', {
      transaction,
    });

    expect(createAccessTokenSpy).toHaveBeenCalledWith(
      client,
      mappedUser,
      null,
      transaction,
    );
    expect(createRefreshTokenSpy).toHaveBeenCalledWith(
      newAccessToken,
      null,
      transaction,
    );
    expect(currentAccessTokenDestroySpy).toHaveBeenCalledWith({ transaction });
  });

  it('should return refresh token on find succeeds', async () => {
    const refreshToken: RefreshTokenModel = { id: 'token' } as any;
    const findSpy = jest
      .spyOn(model, 'findByPk')
      .mockReturnValue(Promise.resolve(refreshToken));

    const transaction = null;
    expect(await service.find(refreshToken.id, transaction)).toEqual(
      refreshToken,
    );
    expect(findSpy).toHaveBeenCalledWith(refreshToken.id, { transaction });
  });

  it('should return null when find fails', async () => {
    const findSpy = jest
      .spyOn(model, 'findByPk')
      .mockReturnValue(Promise.resolve(null));

    const transaction = null;
    expect(await service.find('test', transaction)).toEqual(null);
    expect(findSpy).toHaveBeenCalledWith('test', { transaction });
  });

  it('should create new refresh token with default date', async () => {
    const refreshToken: RefreshTokenModel = {
      id: 'test',
      setAttributes: (value) => value,
      save: (value) => value,
    } as any;

    const buildSpy = jest.spyOn(model, 'build').mockReturnValue(refreshToken);

    const content = 'content';
    const generateSpy = jest
      .spyOn(randomByteGenerate, 'generateRandomByte')
      .mockReturnValue(Buffer.from(content));

    const setAttributesSpy = jest
      .spyOn(refreshToken, 'setAttributes')
      .mockReturnValue(refreshToken);
    const saveSpy = jest
      .spyOn(refreshToken, 'save')
      .mockReturnValue(Promise.resolve(refreshToken));

    const accessToken: AccessTokenModel = { id: 'test' } as any;

    expect(await service.create(accessToken)).toEqual(refreshToken);
    expect(buildSpy).toHaveBeenCalled();
    expect(setAttributesSpy).toHaveBeenCalledWith({
      id: Buffer.from(content).toString('hex'),
      access_token_id: accessToken.id,
      expires_at: null,
    });
    expect(generateSpy).toHaveBeenCalledWith(40);
    expect(saveSpy).toHaveBeenCalledWith({ undefined });
  });
});
