import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationController } from './authorization.controller';
import { TransactionProviderService } from '../../../transaction-manager/services/transaction-provider/transaction-provider.service';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { AuthorizationDto } from '../../dtos/authorization.dto';
import { UserModel } from '../../../databases/models/user.model';
import { GrantTypes } from '../../grant-types/grant-type-implementation';
import { AuthorizationChallengeModel } from '../../../databases/models/oauth/authorization-challenge.model';
import { AuthService } from '../../services/auth/auth.service';

describe('AuthorizationController', () => {
  let controller: AuthorizationController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AuthorizationController],
      providers: [
        {
          provide: TransactionProviderService,
          useValue: {},
        },
        HashEncryptService,
        {
          provide: ConfigService,
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: AuthorizationChallengeRepoService,
          useValue: {
            createWithPkceCodeChallenge: () => Promise.resolve(true),
            createForAuthorizationCode: () => Promise.resolve(true),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthorizationController>(AuthorizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should show login form using encrypted token', async () => {
    const token = plainToInstance(AuthorizationDto, {});
    const hashEncryptService = module.get(HashEncryptService);
    const encryptSpy = jest
      .spyOn(hashEncryptService, 'encrypt')
      .mockReturnValue(Promise.resolve('sample'));

    expect(await controller.showLogin(token)).toEqual({ token: 'sample' });
    expect(encryptSpy).toHaveBeenCalledWith(JSON.stringify(token));
  });

  it('should verify pkce challenge for pkce grant type', async () => {
    const user = {
      id: 1,
    } as UserModel;
    const authorizationDto = new AuthorizationDto();
    authorizationDto.grant_type = GrantTypes.PKCE;
    authorizationDto.code_challenge = Math.random().toString(32).substring(7);
    authorizationDto.algorithm = 'sha512';
    authorizationDto.client_id = Math.random().toString(32).substring(7);

    const authorization = {} as AuthorizationChallengeModel;
    authorization.id = Math.random().toString(32).substring(7);
    const transaction = null;

    const repo = module.get(AuthorizationChallengeRepoService);
    const createChallengeSpy = jest
      .spyOn(repo, 'createWithPkceCodeChallenge')
      .mockReturnValue(Promise.resolve(authorization));

    expect(
      await controller.processLoginAttempt(
        { user, authorization: authorizationDto },
        transaction,
      ),
    ).toEqual(authorization);

    expect(createChallengeSpy).toHaveBeenCalledWith(
      user,
      authorizationDto.client_id,
      {
        challenge: authorizationDto.code_challenge,
        algorithm: authorizationDto.algorithm,
      },
      transaction,
    );
  });

  it('should verify code for authorization code grant type', async () => {
    const user = {
      id: 1,
    } as UserModel;
    const authorizationDto = new AuthorizationDto();
    authorizationDto.grant_type = GrantTypes.AuthorizationCode;
    authorizationDto.code_challenge = Math.random().toString(32).substring(7);

    const authorization = {} as AuthorizationChallengeModel;
    authorization.id = Math.random().toString(32).substring(7);
    const transaction = null;

    const repo = module.get(AuthorizationChallengeRepoService);
    const createChallengeSpy = jest
      .spyOn(repo, 'createForAuthorizationCode')
      .mockReturnValue(Promise.resolve(authorization));

    expect(
      await controller.processLoginAttempt(
        { user, authorization: authorizationDto },
        transaction,
      ),
    ).toEqual(authorization);

    expect(createChallengeSpy).toHaveBeenCalledWith(
      user,
      authorizationDto.client_id,
      transaction,
    );
  });
});
