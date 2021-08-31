import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepoService } from '../../../user/services/user-repo/user-repo.service';
import { HashEncryptService } from '../hash-encrypt/hash-encrypt.service';
import { UserModel } from '../../../databases/models/user.model';
import { ConfigService } from '@nestjs/config';
import { AccessTokenRepoService } from '../oauth/access-token-repo/access-token-repo.service';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenModel } from '../../../databases/models/oauth/access-token.model';

describe('AuthService', () => {
  let service: AuthService;
  let hashService: HashEncryptService;

  const configService: ConfigService = {} as any;
  const accessTokenRepo: AccessTokenRepoService = {
    findForActiveState: (value) => value,
  } as any;
  const jwtService: JwtService = {
    decode: (value) => value,
  } as any;

  const userRepo: UserRepoService = {
    findByEmail: (value) => value,
    findOrFail: (value) => value,
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
      email: 'email@email.com',
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
      email: 'email@email.com',
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
      email: 'email@email.com',
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
      email: 'email@email.com',
      password: 'passwordHash',
    } as any;

    const findByIdOrFailSpy = jest
      .spyOn(userRepo, 'findOrFail')
      .mockReturnValueOnce(Promise.resolve(user));

    expect(await service.getLoggedInUser(user.id)).toEqual(user);
    expect(findByIdOrFailSpy).toHaveBeenCalledWith(user.id);
  });

  it('should map user to session', async () => {
    const session = { save: (value) => value } as any;

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
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should throw error when mapping of user to session fails to be saved', async () => {
    const session = { save: (value) => value } as any;

    const saveSpy = jest
      .spyOn(session, 'save')
      .mockImplementation((callback: (err: string) => void) => {
        callback('errorPassed');
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
  });

  it('should return user when searching for user by token', async () => {
    const decodeSpy = jest
      .spyOn(jwtService, 'decode')
      .mockReturnValue('decoded');
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

  it('should return null when access token is not found when searching for user by token', async () => {
    const decodeSpy = jest
      .spyOn(jwtService, 'decode')
      .mockReturnValue('decoded');
    const findActiveToken = jest
      .spyOn(accessTokenRepo, 'findForActiveState')
      .mockReturnValue(Promise.resolve(null));

    expect(await service.findUserByToken('token')).toEqual(null);
    expect(decodeSpy).toHaveBeenCalledWith('token');
    expect(findActiveToken).toHaveBeenCalledWith('decoded');
  });

  it('should return null when searching for user by token returns no result for user', async () => {
    const decodeSpy = jest
      .spyOn(jwtService, 'decode')
      .mockReturnValue('decoded');
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
      .spyOn(jwtService, 'decode')
      .mockReturnValue('decoded');
    const token: AccessTokenModel = { id: 'id', user_id: null } as any;
    const findActiveToken = jest
      .spyOn(accessTokenRepo, 'findForActiveState')
      .mockReturnValue(Promise.resolve(token));

    expect(await service.findUserByToken('token')).toEqual(null);
    expect(decodeSpy).toHaveBeenCalledWith('token');
    expect(findActiveToken).toHaveBeenCalledWith('decoded');
  });
});
