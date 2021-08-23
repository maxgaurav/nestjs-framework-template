import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepoService } from '../../../user/services/user-repo/user-repo.service';
import { HashEncryptService } from '../hash-encrypt/hash-encrypt.service';
import { UserModel } from '../../../databases/models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let hashService: HashEncryptService;

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
});
