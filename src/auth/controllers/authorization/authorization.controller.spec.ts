import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationController } from './authorization.controller';
import { TransactionProviderService } from '../../../transaction-manager/services/transaction-provider/transaction-provider.service';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service';

describe('AuthorizationController', () => {
  let controller: AuthorizationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorizationController],
      providers: [
        {
          provide: TransactionProviderService,
          useValue: {},
        },
        {
          provide: HashEncryptService,
          useValue: {},
        },
        {
          provide: AuthorizationChallengeRepoService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthorizationController>(AuthorizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
