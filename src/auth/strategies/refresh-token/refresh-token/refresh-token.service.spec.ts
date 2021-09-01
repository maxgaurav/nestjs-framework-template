import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenService } from './refresh-token.service';
import { AuthService } from '../../../services/auth/auth.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { RefreshTokenDto } from '../../../dtos/refresh-token/refresh-token.dto';
import { RefreshTokenModel } from '../../../../databases/models/oauth/refresh-token.model';
import { IsNotEmpty } from 'class-validator';

class PassValidation {
  constructor(public content: any) {}
}

class FailValidation {
  @IsNotEmpty()
  public id: any;

  constructor(public content: any) {}
}

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;

  const authService: AuthService = {
    findRefreshToken: (value) => value,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw not found exception if headers are not correct', async () => {
    const request: Request = {
      headers: { accept: 'fail' },
    } as any;

    let errorThrown = false;

    try {
      await service.validate(request);
    } catch (err) {
      if (err instanceof NotFoundException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should return refresh token when found', async () => {
    const request: Request = {
      headers: { accept: 'application/json' },
      body: { test: 'test' },
    } as any;

    const dto = new RefreshTokenDto({ refresh_token: 'token' });
    const validateContentSpy = jest
      .spyOn(service, 'validateContent')
      .mockReturnValue(Promise.resolve(dto));

    const token: RefreshTokenModel = { id: 1 } as any;

    const findTokenSpy = jest
      .spyOn(authService, 'findRefreshToken')
      .mockReturnValue(Promise.resolve(token));

    expect(await service.validate(request)).toEqual(token);
    expect(validateContentSpy).toHaveBeenCalledWith(
      request.body,
      expect.anything(),
    );

    expect(findTokenSpy).toHaveBeenCalledWith(dto.refresh_token);
  });

  it('should throw unauthorized exception when refresh token not found', async () => {
    const request: Request = {
      headers: { accept: 'application/json' },
      body: { test: 'test' },
    } as any;

    const dto = new RefreshTokenDto({ refresh_token: 'token' });
    const validateContentSpy = jest
      .spyOn(service, 'validateContent')
      .mockReturnValue(Promise.resolve(dto));

    const findTokenSpy = jest
      .spyOn(authService, 'findRefreshToken')
      .mockReturnValue(Promise.resolve(null));

    let errorThrown = false;
    try {
      await service.validate(request);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
    expect(validateContentSpy).toHaveBeenCalledWith(
      request.body,
      expect.anything(),
    );

    expect(findTokenSpy).toHaveBeenCalledWith(dto.refresh_token);
  });

  it('should pass validation when valid body is passed', async () => {
    const result = await service.validateContent({}, PassValidation as any);
    expect(result instanceof PassValidation).toEqual(true);
    expect((result as any).content).toEqual({});
  });

  it('should throw validation error when content is incorrect', async () => {
    let errorThrown = false;
    try {
      await service.validateContent({}, FailValidation as any);
    } catch {
      errorThrown = true;
    }

    expect(errorThrown).toEqual(true);
  });
});
