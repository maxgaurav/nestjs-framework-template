import { Test, TestingModule } from '@nestjs/testing';
import { OauthController } from './oauth.controller';
import { TransactionProviderService } from '../../../transaction-manager/services/transaction-provider/transaction-provider.service';
import { AccessTokenRepoService } from '../../services/oauth/access-token-repo/access-token-repo.service';
import { RefreshTokenRepoService } from '../../services/oauth/refresh-token-repo/refresh-token-repo.service';
import { UserModel } from '../../../databases/models/user.model';
import { ClientModel } from '../../../databases/models/oauth/client.model';
import { AccessTokenModel } from '../../../databases/models/oauth/access-token.model';
import { RefreshTokenModel } from '../../../databases/models/oauth/refresh-token.model';

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

    expect(await controller.login(authContent, transaction)).toEqual({
      type: 'Bearer',
      expires_in: null,
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
  });

  it('should generate new tokens on refresh', async () => {
    const currentRefreshToken: RefreshTokenModel = { id: 'current' } as any;
    const refreshToken: RefreshTokenModel = { id: 'new' } as any;
    const accessToken: AccessTokenModel = { id: 'new' } as any;

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
      expires_in: null,
      access_token: 'accessBearer',
      refresh_token: 'refreshBearer',
    });

    expect(consumerRefreshTokenSpy).toHaveBeenCalledWith(
      currentRefreshToken,
      transaction,
    );
    expect(createAccessTokenBearerSpy).toHaveBeenCalledWith(accessToken);
    expect(createRefreshTokenBearerSpy).toHaveBeenCalledWith(refreshToken);
  });
});
