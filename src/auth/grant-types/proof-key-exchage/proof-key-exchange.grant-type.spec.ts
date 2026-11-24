import { UnprocessableEntityException } from '@nestjs/common';
import { vi } from 'vitest';
import { ProofKeyExchangeGrantType } from './proof-key-exchange.grant-type';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service';

describe('ProofKeyExchangeGrantType', () => {
  let service: ProofKeyExchangeGrantType;

  const authorizationRepo: AuthorizationChallengeRepoService = {
    verifyChallenge: () => Promise.resolve(false),
  } as unknown as AuthorizationChallengeRepoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProofKeyExchangeGrantType,
        {
          provide: AuthorizationChallengeRepoService,
          useValue: authorizationRepo,
        },
      ],
    }).compile();

    service = await module.resolve<ProofKeyExchangeGrantType>(
      ProofKeyExchangeGrantType,
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
    vi.spyOn(authorizationRepo, 'verifyChallenge').mockResolvedValue(
      result as never,
    );

    await expect(
      service.validate({ code: 'code', code_verifier: 'verifier' } as never),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('should return user and client for an active client', async () => {
    const result = { user: { id: 1 }, client: { is_revoked: false } };
    vi.spyOn(authorizationRepo, 'verifyChallenge').mockResolvedValue(
      result as never,
    );

    await expect(
      service.validate({ code: 'code', code_verifier: 'verifier' } as never),
    ).resolves.toEqual(result);
  });
});
