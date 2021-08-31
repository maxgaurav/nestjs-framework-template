import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenService } from './access-token.service';
import { AuthService } from '../../services/auth/auth.service';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';
import { AccessTokenDto } from '../../dtos/access-token/access-token.dto';
import { UserModel } from '../../../databases/models/user.model';
import { ClientModel } from '../../../databases/models/oauth/client.model';
import { Request } from 'express';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';

class FailureClass {
  @IsNotEmpty()
  public name;

  constructor(public content) {}
}

describe('AccessTokenService', () => {
  let service: AccessTokenService;

  const authService: AuthService = {
    validateForPassword: (value) => value,
  } as any;
  const clientRepo: ClientRepoService = { findOrFail: (value) => value } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenService,
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: ClientRepoService,
          useValue: clientRepo,
        },
      ],
    }).compile();

    service = module.get<AccessTokenService>(AccessTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user and client model on successful validation', async () => {
    const dto = new AccessTokenDto({
      email: 'test@test.com',
      password: 'password',
      client_id: 'clientId',
    });

    const validateContentSpy = jest
      .spyOn(service, 'validateContent')
      .mockReturnValue(Promise.resolve(dto));

    const user: UserModel = { id: 1 } as any;
    const client: ClientModel = { id: 'test' } as any;

    const validatePasswordSpy = jest
      .spyOn(authService, 'validateForPassword')
      .mockReturnValue(Promise.resolve(user));

    const findSpy = jest
      .spyOn(clientRepo, 'findOrFail')
      .mockReturnValue(Promise.resolve(client));

    const request: Request = {
      headers: { accept: 'application/json' },
      body: { test: 'test' },
    } as any;

    expect(await service.validate(request)).toEqual({ user, client });
    expect(validateContentSpy).toHaveBeenCalledWith(
      request.body,
      AccessTokenDto,
    );
    expect(validatePasswordSpy).toHaveBeenCalledWith(dto.email, dto.password);
    expect(findSpy).toHaveBeenCalledWith(dto.client_id);
  });

  it('should throw not found exception when accept header is incorrect', async () => {
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

  it('should throw unauthorized exception when user is not found', async () => {
    const dto = new AccessTokenDto({
      email: 'test@test.com',
      password: 'password',
      client_id: 'clientId',
    });

    const validateContentSpy = jest
      .spyOn(service, 'validateContent')
      .mockReturnValue(Promise.resolve(dto));

    const validatePasswordSpy = jest
      .spyOn(authService, 'validateForPassword')
      .mockReturnValue(Promise.resolve(null));

    const request: Request = {
      headers: { accept: 'application/json' },
    } as any;

    let errorThrown = false;

    try {
      await service.validate(request);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
    expect(validateContentSpy).toHaveBeenCalled();
    expect(validatePasswordSpy).toHaveBeenCalled();
  });

  it('should return true when validation passes', async () => {
    const sampleClass = class {
      constructor(public content) {}
    };

    const result = await service.validateContent({} as any, sampleClass as any);
    expect(result instanceof sampleClass).toEqual(true);
    expect(result).toEqual(
      expect.objectContaining({
        content: {},
      }),
    );
  });

  it('should throw error when validation fails', async () => {
    let errorThrown = false;
    try {
      await service.validateContent({} as any, FailureClass as any);
    } catch (err) {
      errorThrown = true;
    }

    expect(errorThrown).toEqual(true);
  });
});
