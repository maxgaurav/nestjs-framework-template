import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepoService } from '../../../user/services/user-repo/user-repo.service';
import { HashEncryptService } from '../hash-encrypt/hash-encrypt.service';
import { UserModel } from '../../../databases/models/user.model';
import { ConfigService } from '@nestjs/config';
import { AccessTokenRepoService } from '../oauth/access-token-repo/access-token-repo.service';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenModel } from '../../../databases/models/oauth/access-token.model';
import { RefreshTokenRepoService } from '../oauth/refresh-token-repo/refresh-token-repo.service';
import { RefreshTokenModel } from '../../../databases/models/oauth/refresh-token.model';

const FakedEmail = 'email@email.com';
describe('AuthService', () => {
  let service: AuthService;
  let hashService: HashEncryptService;

  const configService: ConfigService = {} as any;
  const accessTokenRepo: AccessTokenRepoService = {
    findForActiveState: (value) => value,
  } as any;
  const jwtService: JwtService = {
    decode: (value) => value,
    verifyAsync: (value) => value,
  } as any;

  const userRepo: UserRepoService = {
    findByEmail: (value) => value,
    findOrFail: (value) => value,
  } as any;

  const refreshTokenRepo: RefreshTokenRepoService = {
    find: (value) => value,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepoService,
          useValue: userRepo,
        },
        {
          provide: ConfigService,
          useValue: configService,
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
          provide: RefreshTokenRepoService,
          useValue: refreshTokenRepo,
        },
        HashEncryptService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    hashService = module.get<HashEncryptService>(HashEncryptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user when user is found and hash passes', async () => {
    const user: UserModel = {
      id: 1,
      email: FakedEmail,
      password: await hashService.createHash('password'),
    } as any;
    const findByEmailSpy = jest
      .spyOn(userRepo, 'findByEmail')
      .mockReturnValueOnce(Promise.resolve(user));

    expect(await service.validateForPassword(user.email, 'password')).toEqual(
      user,
    );
    expect(findByEmailSpy).toHaveBeenCalledWith(user.email);
  });

  it('should return null when user is not found', async () => {
    const user: UserModel = {
      id: 1,
      email: FakedEmail,
      password: await hashService.createHash('password'),
    } as any;

    const findByEmailSpy = jest
      .spyOn(userRepo, 'findByEmail')
      .mockReturnValueOnce(Promise.resolve(null));

    expect(await service.validateForPassword(user.email, 'password')).toEqual(
      null,
    );
    expect(findByEmailSpy).toHaveBeenCalledWith(user.email);
  });

  it('should return null when password hash do not match', async () => {
    const user: UserModel = {
      id: 1,
      email: FakedEmail,
      password: await hashService.createHash('passwordNotMatch'),
    } as any;

    const findByEmailSpy = jest
      .spyOn(userRepo, 'findByEmail')
      .mockReturnValueOnce(Promise.resolve(user));

    expect(await service.validateForPassword(user.email, 'password')).toEqual(
      null,
    );
    expect(findByEmailSpy).toHaveBeenCalledWith(user.email);
  });

  it('should return the user model form service for the user id', async () => {
    const user: UserModel = {
      id: 1,
      email: FakedEmail,
      password: 'passwordHash',
    } as any;

    const findByIdOrFailSpy = jest
      .spyOn(userRepo, 'findOrFail')
      .mockReturnValueOnce(Promise.resolve(user));

    expect(await service.getLoggedInUser(user.id)).toEqual(user);
    expect(findByIdOrFailSpy).toHaveBeenCalledWith(user.id);
  });

  it('should map user to session', async () => {
    const session = {
      save: (value) => value,
      regenerate: (value) => value,
    } as any;

    const regenerateSpy = jest
      .spyOn(session, 'regenerate')
      .mockImplementation((callback: () => void) => {
        callback();
      });

    const saveSpy = jest
      .spyOn(session, 'save')
      .mockImplementation((callback: () => void) => {
        callback();
      });

    const user: UserModel = { id: 1 } as any;
    await service.mapSessionWithUser(session, user);
    expect(session).toEqual(
      expect.objectContaining({
        auth: { isAuth: true, userId: user.id },
      }),
    );
    expect(regenerateSpy).toHaveBeenCalled();
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should throw error when mapping of user to session fails to be saved', async () => {
    const session = {
      save: (value) => value,
      regenerate: (value) => value,
    } as any;

    const saveSpy = jest
      .spyOn(session, 'save')
      .mockImplementation((callback: (err: string) => void) => {
        callback('errorPassed');
      });

    const regenerateSpy = jest
      .spyOn(session, 'regenerate')
      .mockImplementation((callback: () => void) => {
        callback();
      });

    const user: UserModel = { id: 1 } as any;
    let errorThrown = false;
    try {
      await service.mapSessionWithUser(session, user);
    } catch (err) {
      if (err === 'errorPassed') {
        errorThrown = true;
      }
    }
    expect(saveSpy).toHaveBeenCalled();
    expect(errorThrown).toEqual(true);
    expect(regenerateSpy).toHaveBeenCalled();
  });

  it('should return user when searching for user by token', async () => {
    const decodeSpy = jest
      .spyOn(jwtService, 'verifyAsync')
      .mockReturnValue(Promise.resolve('decoded') as any);
    const token: AccessTokenModel = { id: 'id', user_id: 1 } as any;
    const user: UserModel = { id: 1 } as any;
    const findActiveToken = jest
      .spyOn(accessTokenRepo, 'findForActiveState')
      .mockReturnValue(Promise.resolve(token));

    const loggedInUserSpy = jest
      .spyOn(service, 'getLoggedInUser')
      .mockReturnValue(Promise.resolve(user));

    expect(await service.findUserByToken('token')).toEqual(user);
    expect(decodeSpy).toHaveBeenCalledWith('token');
    expect(findActiveToken).toHaveBeenCalledWith('decoded');
    expect(loggedInUserSpy).toHaveBeenCalledWith(token.user_id);
  });

  it('should return null when searching for user by token returns no result for user', async () => {
    const decodeSpy = jest
      .spyOn(jwtService, 'verifyAsync')
      .mockReturnValue(Promise.resolve('decoded') as any);
    const token: AccessTokenModel = { id: 'id', user_id: 1 } as any;
    const findActiveToken = jest
      .spyOn(accessTokenRepo, 'findForActiveState')
      .mockReturnValue(Promise.resolve(token));

    const loggedInUserSpy = jest
      .spyOn(service, 'getLoggedInUser')
      .mockReturnValue(Promise.resolve(null));

    expect(await service.findUserByToken('token')).toEqual(null);
    expect(decodeSpy).toHaveBeenCalledWith('token');
    expect(findActiveToken).toHaveBeenCalledWith('decoded');
    expect(loggedInUserSpy).toHaveBeenCalledWith(token.user_id);
  });

  it('should return null when access token is not mapped to user', async () => {
    const decodeSpy = jest
      .spyOn(jwtService, 'verifyAsync')
      .mockReturnValue(Promise.resolve('decoded') as any);
    const token: AccessTokenModel = { id: 'id', user_id: null } as any;
    const findActiveToken = jest
      .spyOn(accessTokenRepo, 'findForActiveState')
      .mockReturnValue(Promise.resolve(token));

    expect(await service.findUserByToken('token')).toEqual(null);
    expect(decodeSpy).toHaveBeenCalledWith('token');
    expect(findActiveToken).toHaveBeenCalledWith('decoded');
  });

  it('should return refresh token from hashed token', async () => {
    const decodeSpy = jest
      .spyOn(jwtService, 'verifyAsync')
      .mockReturnValue(Promise.resolve('token') as any);
    const refreshToken: RefreshTokenModel = { id: 'token' } as any;
    const findSpy = jest
      .spyOn(refreshTokenRepo, 'find')
      .mockReturnValue(Promise.resolve(refreshToken));

    expect(await service.findRefreshToken('hashed')).toEqual(refreshToken);
    expect(decodeSpy).toHaveBeenCalledWith('hashed');
    expect(findSpy).toHaveBeenCalledWith('token');
  });
});
