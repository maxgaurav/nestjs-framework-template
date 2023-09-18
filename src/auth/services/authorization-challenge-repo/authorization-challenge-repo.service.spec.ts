import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationChallengeRepoService } from './authorization-challenge-repo.service';
import { getModelToken } from '@nestjs/sequelize';
import { AuthorizationChallengeModel } from '../../../databases/models/oauth/authorization-challenge.model';
import { TransactionProviderService } from '../../../transaction-manager/services/transaction-provider/transaction-provider.service';

describe('AuthorizationChallengeRepoService', () => {
  let service: AuthorizationChallengeRepoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationChallengeRepoService,
        {
          provide: getModelToken(AuthorizationChallengeModel),
          useValue: {},
        },
        {
          provide: TransactionProviderService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthorizationChallengeRepoService>(
      AuthorizationChallengeRepoService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
