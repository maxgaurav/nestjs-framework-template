import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenService } from './access-token.service';
import { AuthService } from '../../services/auth/auth.service';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';
import { Request } from 'express';
import { NotFoundException } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';

class FailureClass {
  @IsNotEmpty()
  public name;

  constructor(public content: any) {}
}

describe('AccessTokenService', () => {
  let service: AccessTokenService;

  const authService: AuthService = {
    validateForPassword: (value) => value,
  } as any;
  const clientRepo: ClientRepoService = {
    findForIdAndSecret: (value) => value,
  } as any;

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
