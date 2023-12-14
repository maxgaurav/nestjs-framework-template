import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenService } from './refresh-token.service';
import { AuthService } from '../../../services/auth/auth.service';
import {
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Request } from 'express';
import { RefreshTokenDto } from '../../../dtos/refresh-token.dto';
import { RefreshTokenModel } from '../../../../databases/models/oauth/refresh-token.model';
import { IsNotEmpty } from 'class-validator';
import mockdate from 'mockdate';
import moment from 'moment';
import { ClientRepoService } from '../../../services/oauth/client-repo/client-repo.service';
import { ClientModel } from '../../../../databases/models/oauth/client.model';

class PassValidation {
  constructor(public content: any) {}
}

class FailValidation {
  @IsNotEmpty()
  public id: any;

  constructor(public content: any) {}
}

const AcceptApplicationJson = 'application/json';
describe('RefreshTokenService', () => {
  let service: RefreshTokenService;

  const authService: AuthService = {
    findRefreshToken: (value) => value,
  } as any;

  const clientRepo: ClientRepoService = {
    findForIdAndSecret: (value) => value,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
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
      headers: { accept: AcceptApplicationJson },
      body: { test: 'test' },
    } as any;

    const client: ClientModel = { id: 'client', secret: 'secret' } as any;

    const dto = new RefreshTokenDto({
      refresh_token: 'token',
      client_id: client.id,
      client_secret: client.secret,
    });

    const validateContentSpy = jest
      .spyOn(service, 'validateContent')
      .mockReturnValue(Promise.resolve(dto));

    const findClientSpy = jest
      .spyOn(clientRepo, 'findForIdAndSecret')
      .mockReturnValue(Promise.resolve(client));

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
    expect(findClientSpy).toHaveBeenCalledWith(
      dto.client_id,
      dto.client_secret,
    );
  });

  it('should throw unauthorized exception when refresh token not found', async () => {
    const request: Request = {
      headers: { accept: AcceptApplicationJson },
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

  it('should throw unauthorized exception when date has expired', async () => {
    mockdate.set('2021-01-01 00:00:00');
    const request: Request = {
      headers: { accept: AcceptApplicationJson },
      body: { test: 'test' },
    } as any;

    const dto = new RefreshTokenDto({ refresh_token: 'token' });
    const validateContentSpy = jest
      .spyOn(service, 'validateContent')
      .mockReturnValue(Promise.resolve(dto));

    const token: RefreshTokenModel = {
      id: 1,
      expires_at: moment().subtract(1, 'day'),
    } as any;

    const findTokenSpy = jest
      .spyOn(authService, 'findRefreshToken')
      .mockReturnValue(Promise.resolve(token));

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

  it('should throw unprocessable error when client is not found', async () => {
    const request: Request = {
      headers: { accept: AcceptApplicationJson },
      body: { test: 'test' },
    } as any;

    const client: ClientModel = { id: 'client', secret: 'secret' } as any;

    const dto = new RefreshTokenDto({
      refresh_token: 'token',
      client_id: client.id,
      client_secret: client.secret,
    });

    const validateContentSpy = jest
      .spyOn(service, 'validateContent')
      .mockReturnValue(Promise.resolve(dto));

    const findClientSpy = jest
      .spyOn(clientRepo, 'findForIdAndSecret')
      .mockReturnValue(Promise.resolve(null));

    let errorThrown = false;

    try {
      await service.validate(request);
    } catch (err) {
      if (err instanceof UnprocessableEntityException) {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
    expect(validateContentSpy).toHaveBeenCalledWith(
      request.body,
      expect.anything(),
    );
    expect(findClientSpy).toHaveBeenCalledWith(
      dto.client_id,
      dto.client_secret,
    );
  });
});
