import { Test, TestingModule } from '@nestjs/testing';
import { SessionStrategyService } from './session-strategy.service';
import { AuthService } from '../../services/auth/auth.service';
import { UserModel } from '../../../databases/models/user.model';
import {
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LoginPasswordDto } from '../../dtos/login-password/login-password.dto';

const FakedEmail = 'email@email.com';
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
      email: FakedEmail,
      password: 'password',
    } as any;

    const dto = new LoginPasswordDto({
      email: user.email,
      password: user.password,
    });

    const validateContentSpy = jest
      .spyOn(service, 'validateContent')
      .mockReturnValue(Promise.resolve(dto));

    const validateSpy = jest
      .spyOn(authService, 'validateForPassword')
      .mockReturnValueOnce(Promise.resolve(user));

    expect(await service.validate(user.email, user.password)).toEqual(user);
    expect(validateSpy).toHaveBeenCalledWith(dto.email, dto.password);
    expect(validateContentSpy).toHaveBeenCalledWith(dto.email, dto.password);
  });

  it('should throw unauthorized exception when user is not found', async () => {
    const dto = new LoginPasswordDto({
      email: FakedEmail,
      password: 'password',
    });
    const validateContentSpy = jest
      .spyOn(service, 'validateContent')
      .mockReturnValue(Promise.resolve(dto));

    let errorThrown = false;
    const validateSpy = jest
      .spyOn(authService, 'validateForPassword')
      .mockReturnValueOnce(Promise.resolve(null));
    try {
      await service.validate(dto.email, dto.password);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
    expect(validateSpy).toHaveBeenCalledWith(FakedEmail, 'password');
    expect(validateContentSpy).toHaveBeenCalled();
  });

  it('should return dto when validation passes', async () => {
    const result = await service.validateContent('test@test.com', 'password');
    expect(result instanceof LoginPasswordDto).toEqual(true);
  });

  it('should throw error when validation fails', async () => {
    let errorThrown = false;

    try {
      await service.validateContent('', '');
    } catch (err) {
      if (err instanceof UnprocessableEntityException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });
});
