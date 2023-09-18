import { AuthorizationCodeGrantType } from './authorization-code.grant-type';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthorizationCodeGrantType', () => {
  let service: AuthorizationCodeGrantType;

  const authChallengeRepo: AuthorizationChallengeRepoService =
    {} as AuthorizationChallengeRepoService;

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
});
