import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenRepoService } from './access-token-repo.service';
import { AccessTokenModel } from '../../../../databases/models/oauth/access-token.model';
import { getModelToken } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { RandomByteGeneratorService } from '../../../../common/services/random-byte-generator/random-byte-generator.service';
import { UserModel } from '../../../../databases/models/user.model';
import { ClientModel } from '../../../../databases/models/oauth/client.model';
import { Buffer } from 'buffer';

describe('AccessTokenRepoService', () => {
  let service: AccessTokenRepoService;

  const model: typeof AccessTokenModel = {
    findByPk: (value) => value,
    build: (value) => value,
    findOne: (value) => value,
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
        AccessTokenRepoService,
        {
          provide: getModelToken(AccessTokenModel),
          useValue: model,
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

    service = module.get<AccessTokenRepoService>(AccessTokenRepoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find or fail', async () => {
    const token: AccessTokenModel = { id: 'test' } as any;
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

  it('should create bearer token', async () => {
    const testContent = 'testContent';
    const signSpy = jest
      .spyOn(jwtService, 'signAsync')
      .mockReturnValue(Promise.resolve(testContent));

    const accessToken: AccessTokenModel = { id: 'test' } as any;

    expect(await service.createBearerToken(accessToken)).toEqual(testContent);
    expect(signSpy).toHaveBeenCalledWith(Buffer.from(accessToken.id), {
      algorithm: 'HS256',
    });
  });

  it('should create new access token with user', async () => {
    const accessToken: AccessTokenModel = {
      id: 'test',
      save: (value) => value,
      setAttributes: (value) => value,
    } as any;

    const buildSpy = jest.spyOn(model, 'build').mockReturnValue(accessToken);

    const user: UserModel = { id: 1 } as any;
    const client: ClientModel = { id: 'test' } as any;

    const setAttributeSpy = jest
      .spyOn(accessToken, 'setAttributes')
      .mockReturnValue(accessToken);
    const saveSpy = jest
      .spyOn(accessToken, 'save')
      .mockReturnValue(Promise.resolve(accessToken));

    const sample = 'sample';
    const randomSpy = jest
      .spyOn(randomByteGenerate, 'generateRandomByte')
      .mockReturnValue(Buffer.from(sample));

    const expiresAt = new Date();
    const transaction = null;

    expect(await service.create(client, user, expiresAt, transaction)).toEqual(
      accessToken,
    );

    expect(buildSpy).toHaveBeenCalled();
    expect(setAttributeSpy).toHaveBeenCalledWith({
      client_id: client.id,
      user_id: user.id,
      expires_at: expiresAt,
      id: Buffer.from(sample).toString('hex'),
    });
    expect(randomSpy).toHaveBeenCalledWith(40);

    expect(saveSpy).toHaveBeenCalledWith({ transaction });
  });

  it('should create new access token with user with default expire at value', async () => {
    const accessToken: AccessTokenModel = {
      id: 'test',
      save: (value) => value,
      setAttributes: (value) => value,
    } as any;

    const buildSpy = jest.spyOn(model, 'build').mockReturnValue(accessToken);

    const user: UserModel = { id: 1 } as any;
    const client: ClientModel = { id: 'test' } as any;

    const setAttributeSpy = jest
      .spyOn(accessToken, 'setAttributes')
      .mockReturnValue(accessToken);
    const saveSpy = jest
      .spyOn(accessToken, 'save')
      .mockReturnValue(Promise.resolve(accessToken));

    const sample = 'sample';
    const randomSpy = jest
      .spyOn(randomByteGenerate, 'generateRandomByte')
      .mockReturnValue(Buffer.from(sample));

    const expiresAt = null;
    const transaction = undefined;

    expect(await service.create(client, user)).toEqual(accessToken);

    expect(buildSpy).toHaveBeenCalled();
    expect(setAttributeSpy).toHaveBeenCalledWith({
      client_id: client.id,
      user_id: user.id,
      expires_at: expiresAt,
      id: Buffer.from(sample).toString('hex'),
    });
    expect(randomSpy).toHaveBeenCalledWith(40);

    expect(saveSpy).toHaveBeenCalledWith({ transaction });
  });

  it('should create new access token with user null', async () => {
    const accessToken: AccessTokenModel = {
      id: 'test',
      save: (value) => value,
      setAttributes: (value) => value,
    } as any;

    const buildSpy = jest.spyOn(model, 'build').mockReturnValue(accessToken);

    const user = null;
    const client: ClientModel = { id: 'test' } as any;

    const setAttributeSpy = jest
      .spyOn(accessToken, 'setAttributes')
      .mockReturnValue(accessToken);
    const saveSpy = jest
      .spyOn(accessToken, 'save')
      .mockReturnValue(Promise.resolve(accessToken));

    const sample = 'sample';
    const randomSpy = jest
      .spyOn(randomByteGenerate, 'generateRandomByte')
      .mockReturnValue(Buffer.from(sample));

    const expiresAt = new Date();
    const transaction = null;

    expect(await service.create(client, user, expiresAt, transaction)).toEqual(
      accessToken,
    );

    expect(buildSpy).toHaveBeenCalled();
    expect(setAttributeSpy).toHaveBeenCalledWith({
      client_id: client.id,
      user_id: null,
      expires_at: expiresAt,
      id: Buffer.from(sample).toString('hex'),
    });
    expect(randomSpy).toHaveBeenCalledWith(40);

    expect(saveSpy).toHaveBeenCalledWith({ transaction });
  });

  it('should return active access token when found', async () => {
    const token: AccessTokenModel = { id: 'test' } as any;
    const findSpy = jest
      .spyOn(model, 'findOne')
      .mockReturnValue(Promise.resolve(token));
    expect(await service.findForActiveState(token.id, null)).toEqual(token);
    expect(findSpy).toHaveBeenCalled();
  });

  it('should return null when active token not found', async () => {
    const findSpy = jest
      .spyOn(model, 'findOne')
      .mockReturnValue(Promise.resolve(undefined));
    expect(await service.findForActiveState('test', null)).toEqual(null);
    expect(findSpy).toHaveBeenCalled();
  });
});
