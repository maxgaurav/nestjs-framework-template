import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthController } from './oauth.controller.js';
import { TransactionProviderService } from '../../../transaction-manager/services/transaction-provider/transaction-provider.service.js';
import { AccessTokenRepoService } from '../../services/oauth/access-token-repo/access-token-repo.service.js';
import { RefreshTokenRepoService } from '../../services/oauth/refresh-token-repo/refresh-token-repo.service.js';
import { UserModel } from '../../../databases/models/user.model.js';
import { ClientModel } from '../../../databases/models/oauth/client.model.js';
import { AccessTokenModel } from '../../../databases/models/oauth/access-token.model.js';
import { RefreshTokenModel } from '../../../databases/models/oauth/refresh-token.model.js';
import { ConfigService } from '@nestjs/config';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service.js';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service.js';

describe('OauthController', () => {
  let controller: OauthController;

  const accessTokenRepo: AccessTokenRepoService = {
    create: (value: any) => value,
    createBearerToken: (value: any) => value,
  } as any;
  const refreshTokenRepo: RefreshTokenRepoService = {
    create: (value: any) => value,
    createBearerToken: (value: any) => value,
    consumeToken: (value: any) => value,
  } as any;

  const configService: ConfigService = {
    get: (value: any) => value,
    getOrThrow: (value: any) => value,
  } as any;

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OauthController],
      providers: [
        {
          provide: TransactionProviderService,
          useValue: {},
        },
        {
          provide: RefreshTokenRepoService,
          useValue: refreshTokenRepo,
        },
        {
          provide: AccessTokenRepoService,
          useValue: accessTokenRepo,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: HashEncryptService,
          useValue: {},
        },
        {
          provide: AuthorizationChallengeRepoService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<OauthController>(OauthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should login user by generating tokens', async () => {
    const user: UserModel = { id: 1 } as any;
    const client: ClientModel = { id: 'client' } as any;
    const authContent = { user, client };
    const transaction = undefined;

    const accessToken: AccessTokenModel = { id: 'token' } as any;
    const refreshToken: RefreshTokenModel = { id: 'token' } as any;

    const createAccessTokenSpy = vi
      .spyOn(accessTokenRepo, 'create')
      .mockReturnValue(Promise.resolve(accessToken));

    const createAccessTokenBearerSpy = vi
      .spyOn(accessTokenRepo, 'createBearerToken')
      .mockReturnValue(Promise.resolve('accessBearer'));

    const createRefreshTokenSpy = vi
      .spyOn(refreshTokenRepo, 'create')
      .mockReturnValue(Promise.resolve(refreshToken));

    const createRefreshTokenBearerSpy = vi
      .spyOn(refreshTokenRepo, 'createBearerToken')
      .mockReturnValue(Promise.resolve('refreshBearer'));

    const getAccessDateSpy = vi
      .spyOn(controller, 'accessTokenExpiration')
      .mockReturnValue(null);
    const getRefreshDateSpy = vi
      .spyOn(controller, 'refreshTokenExpiration')
      .mockReturnValue(null);

    expect(await controller.token(authContent, transaction)).toEqual({
      type: 'Bearer',
      expires_at: null,
      access_token: 'accessBearer',
      refresh_token: 'refreshBearer',
    });

    expect(createAccessTokenSpy).toHaveBeenCalledWith(
      client,
      user,
      null,
      transaction,
    );
    expect(createRefreshTokenSpy).toHaveBeenCalledWith(
      accessToken,
      null,
      transaction,
    );
    expect(createAccessTokenBearerSpy).toHaveBeenCalledWith(accessToken);
    expect(createRefreshTokenBearerSpy).toHaveBeenCalledWith(refreshToken);
    expect(getAccessDateSpy).toHaveBeenCalled();
    expect(getRefreshDateSpy).toHaveBeenCalled();
  });

  it('should generate new tokens on refresh', async () => {
    const currentRefreshToken: RefreshTokenModel = { id: 'current' } as any;
    const refreshToken: RefreshTokenModel = { id: 'new' } as any;
    const accessToken: AccessTokenModel = { id: 'new' } as any;

    const getAccessDateSpy = vi
      .spyOn(controller, 'accessTokenExpiration')
      .mockReturnValue(null);
    const getRefreshDateSpy = vi
      .spyOn(controller, 'refreshTokenExpiration')
      .mockReturnValue(null);

    const createAccessTokenBearerSpy = vi
      .spyOn(accessTokenRepo, 'createBearerToken')
      .mockReturnValue(Promise.resolve('accessBearer'));

    const createRefreshTokenBearerSpy = vi
      .spyOn(refreshTokenRepo, 'createBearerToken')
      .mockReturnValue(Promise.resolve('refreshBearer'));

    const consumerRefreshTokenSpy = vi
      .spyOn(refreshTokenRepo, 'consumeToken')
      .mockReturnValue(Promise.resolve({ refreshToken, accessToken }));

    const transaction = undefined;

    expect(
      await controller.refreshAccessToken(currentRefreshToken, transaction),
    ).toEqual({
      type: 'Bearer',
      expires_at: null,
      access_token: 'accessBearer',
      refresh_token: 'refreshBearer',
    });

    expect(consumerRefreshTokenSpy).toHaveBeenCalledWith(
      currentRefreshToken,
      null,
      null,
      transaction,
    );
    expect(createAccessTokenBearerSpy).toHaveBeenCalledWith(accessToken);
    expect(createRefreshTokenBearerSpy).toHaveBeenCalledWith(refreshToken);
    expect(getAccessDateSpy).toHaveBeenCalled();
    expect(getRefreshDateSpy).toHaveBeenCalled();
  });

  it('should return null when expiration time for access token is null', () => {
    const getSpy = vi
      .spyOn(configService, 'getOrThrow')
      .mockReturnValue({ expirationTimeAccessToken: null });

    expect(controller.accessTokenExpiration()).toEqual(null);
    expect(getSpy).toHaveBeenCalledWith('jwt');
  });

  it('should return date with time extended by expiration time for access token', () => {
    vi.setSystemTime(new Date('2021-01-01 00:00:00'));
    const getSpy = vi
      .spyOn(configService, 'getOrThrow')
      .mockReturnValue({ expirationTimeAccessToken: 30000 });

    const expectedDate = new Date(Date.now() + 30000);

    const expirationDate = controller.accessTokenExpiration();
    expect(expirationDate?.getTime()).toEqual(expectedDate.getTime());
    expect(getSpy).toHaveBeenCalledWith('jwt');
  });

  it('should return null when expiration time for refresh token is null', () => {
    const getSpy = vi
      .spyOn(configService, 'getOrThrow')
      .mockReturnValue({ expirationTimeRefreshToken: null });

    expect(controller.refreshTokenExpiration()).toEqual(null);
    expect(getSpy).toHaveBeenCalledWith('jwt');
  });

  it('should return date with time extended by expiration time for refresh token', () => {
    vi.setSystemTime(new Date('2021-01-01 00:00:00'));
    const getSpy = vi
      .spyOn(configService, 'getOrThrow')
      .mockReturnValue({ expirationTimeRefreshToken: 30000 });

    const expectedDate = new Date(Date.now() + 30000);

    const expirationDate = controller.refreshTokenExpiration();
    expect(expirationDate?.getTime()).toEqual(expectedDate.getTime());
    expect(getSpy).toHaveBeenCalledWith('jwt');
  });
});
