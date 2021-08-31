import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenRepoService } from './refresh-token-repo.service';
import { RefreshTokenModel } from '../../../../databases/models/oauth/refresh-token.model';
import { AccessTokenRepoService } from '../access-token-repo/access-token-repo.service';
import { JwtService } from '@nestjs/jwt';
import { RandomByteGeneratorService } from '../../../../common/services/random-byte-generator/random-byte-generator.service';
import { getModelToken } from '@nestjs/sequelize';
import { AccessTokenModel } from '../../../../databases/models/oauth/access-token.model';

describe('RefreshTokenRepoService', () => {
  let service: RefreshTokenRepoService;

  const model: typeof RefreshTokenModel = {
    findByPk: (value) => value,
    build: (value) => value,
  } as any;
  const accessTokenRepo: AccessTokenRepoService = {} as any;
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
});
