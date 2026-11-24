import { UnprocessableEntityException } from '@nestjs/common';
import { vi } from 'vitest';
import { AuthorizationCodeGrantType } from './authorization-code.grant-type.js';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service.js';
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthorizationCodeGrantType', () => {
  let service: AuthorizationCodeGrantType;

  const authChallengeRepo: AuthorizationChallengeRepoService = {
    verifyWithClientId: () => Promise.resolve(false),
  } as unknown as AuthorizationChallengeRepoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationCodeGrantType,
        {
          provide: AuthorizationChallengeRepoService,
          useValue: authChallengeRepo,
        },
      ],
    }).compile();

    service = await module.resolve<AuthorizationCodeGrantType>(
      AuthorizationCodeGrantType,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each([
    { result: false, type: 'the code is invalid' },
    {
      result: { user: { id: 1 }, client: { is_revoked: true } },
      type: 'the client was revoked after authorization',
    },
  ])('should reject when $type', async ({ result }) => {
    vi.spyOn(authChallengeRepo, 'verifyWithClientId').mockResolvedValue(
      result as never,
    );

    await expect(
      service.validate({ code: 'code', client_id: 'client' } as never),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('should return user and client for an active client', async () => {
    const result = { user: { id: 1 }, client: { is_revoked: false } };
    vi.spyOn(authChallengeRepo, 'verifyWithClientId').mockResolvedValue(
      result as never,
    );

    await expect(
      service.validate({ code: 'code', client_id: 'client' } as never),
    ).resolves.toEqual(result);
  });
});
