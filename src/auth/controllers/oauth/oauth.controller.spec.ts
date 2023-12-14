import { Test, TestingModule } from '@nestjs/testing';
import { OauthController } from './oauth.controller';
import { TransactionProviderService } from '../../../transaction-manager/services/transaction-provider/transaction-provider.service';
import { AccessTokenRepoService } from '../../services/oauth/access-token-repo/access-token-repo.service';
import { RefreshTokenRepoService } from '../../services/oauth/refresh-token-repo/refresh-token-repo.service';
import { UserModel } from '../../../databases/models/user.model';
import { ClientModel } from '../../../databases/models/oauth/client.model';
import { AccessTokenModel } from '../../../databases/models/oauth/access-token.model';
import { RefreshTokenModel } from '../../../databases/models/oauth/refresh-token.model';
import { ConfigService } from '@nestjs/config';
import mockdate from 'mockdate';
import moment from 'moment';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service';

describe('OauthController', () => {
  let controller: OauthController;

  const accessTokenRepo: AccessTokenRepoService = {
    create: (value) => value,
    createBearerToken: (value) => value,
  } as any;
  const refreshTokenRepo: RefreshTokenRepoService = {
    create: (value) => value,
    createBearerToken: (value) => value,
    consumeToken: (value) => value,
  } as any;

  const configService: ConfigService = {
    get: (value) => value,
  } as any;

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
    const transaction = null;

    const accessToken: AccessTokenModel = { id: 'token' } as any;
    const refreshToken: RefreshTokenModel = { id: 'token' } as any;

    const createAccessTokenSpy = jest
      .spyOn(accessTokenRepo, 'create')
      .mockReturnValue(Promise.resolve(accessToken));

    const createAccessTokenBearerSpy = jest
      .spyOn(accessTokenRepo, 'createBearerToken')
      .mockReturnValue(Promise.resolve('accessBearer'));

    const createRefreshTokenSpy = jest
      .spyOn(refreshTokenRepo, 'create')
      .mockReturnValue(Promise.resolve(refreshToken));

    const createRefreshTokenBearerSpy = jest
      .spyOn(refreshTokenRepo, 'createBearerToken')
      .mockReturnValue(Promise.resolve('refreshBearer'));

    const getAccessDateSpy = jest
      .spyOn(controller, 'accessTokenExpiration')
      .mockReturnValue(null);
    const getRefreshDateSpy = jest
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

    const getAccessDateSpy = jest
      .spyOn(controller, 'accessTokenExpiration')
      .mockReturnValue(null);
    const getRefreshDateSpy = jest
      .spyOn(controller, 'refreshTokenExpiration')
      .mockReturnValue(null);

    const createAccessTokenBearerSpy = jest
      .spyOn(accessTokenRepo, 'createBearerToken')
      .mockReturnValue(Promise.resolve('accessBearer'));

    const createRefreshTokenBearerSpy = jest
      .spyOn(refreshTokenRepo, 'createBearerToken')
      .mockReturnValue(Promise.resolve('refreshBearer'));

    const consumerRefreshTokenSpy = jest
      .spyOn(refreshTokenRepo, 'consumeToken')
      .mockReturnValue(Promise.resolve({ refreshToken, accessToken }));

    const transaction = null;

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
    const getSpy = jest
      .spyOn(configService, 'get')
      .mockReturnValue({ expirationTimeAccessToken: null });

    expect(controller.accessTokenExpiration()).toEqual(null);
    expect(getSpy).toHaveBeenCalledWith('jwt');
  });

  it('should return date with time extended by expiration time for access token', () => {
    mockdate.set('2021-01-01 00:00:00');
    const getSpy = jest
      .spyOn(configService, 'get')
      .mockReturnValue({ expirationTimeAccessToken: 30000 });

    const expectedDate = moment().add(30000, 'milliseconds');

    const expirationDate = controller.accessTokenExpiration();
    expect(moment(expirationDate).isSame(expectedDate)).toEqual(true);
    expect(getSpy).toHaveBeenCalledWith('jwt');
  });

  it('should return null when expiration time for refresh token is null', () => {
    const getSpy = jest
      .spyOn(configService, 'get')
      .mockReturnValue({ expirationTimeRefreshToken: null });

    expect(controller.refreshTokenExpiration()).toEqual(null);
    expect(getSpy).toHaveBeenCalledWith('jwt');
  });

  it('should return date with time extended by expiration time for refresh token', () => {
    mockdate.set('2021-01-01 00:00:00');
    const getSpy = jest
      .spyOn(configService, 'get')
      .mockReturnValue({ expirationTimeRefreshToken: 30000 });

    const expectedDate = moment().add(30000, 'milliseconds');

    const expirationDate = controller.refreshTokenExpiration();
    expect(moment(expirationDate).isSame(expectedDate)).toEqual(true);
    expect(getSpy).toHaveBeenCalledWith('jwt');
  });
});
