import { Test, TestingModule } from '@nestjs/testing';
import { SessionStrategyService } from './session-strategy.service';
import { AuthService } from '../../services/auth/auth.service';
import { UserModel } from '../../../databases/models/user.model';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategyService', () => {
  let service: SessionStrategyService;

  const authService: AuthService = {
    validateForPassword: (value) => value,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionStrategyService,
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    service = module.get<SessionStrategyService>(SessionStrategyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user when found by auth handler', async () => {
    const user: UserModel = {
      id: 1,
      email: 'email@email.com',
      password: 'password',
    } as any;

    const validateSpy = jest
      .spyOn(authService, 'validateForPassword')
      .mockReturnValueOnce(Promise.resolve(user));

    expect(await service.validate(user.email, user.password)).toEqual(user);
    expect(validateSpy).toHaveBeenCalledWith(user.email, user.password);
  });

  it('should throw unauthorized exception when user is not found', async () => {
    let errorThrown = false;
    const validateSpy = jest
      .spyOn(authService, 'validateForPassword')
      .mockReturnValueOnce(Promise.resolve(null));
    try {
      await service.validate('email@email.com', 'password');
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
    expect(validateSpy).toHaveBeenCalledWith('email@email.com', 'password');
  });
});
