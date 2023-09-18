import { ProofKeyExchangeGrantType } from './proof-key-exchange.grant-type';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service';

describe('ProofKeyExchangeGrantType', () => {
  let service: ProofKeyExchangeGrantType;

  const authorizationRepo: AuthorizationChallengeRepoService =
    {} as AuthorizationChallengeRepoService;

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
});
