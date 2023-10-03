import { MapUserToSessionInterceptor } from './map-user-to-session.interceptor';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../services/auth/auth.service';
import { AuthorizationChallengeRepoService } from '../../services/authorization-challenge-repo/authorization-challenge-repo.service';

describe('MapUserToSessionInterceptor', () => {
  let interceptor: MapUserToSessionInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapUserToSessionInterceptor,
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: AuthorizationChallengeRepoService,
          useValue: {},
        },
      ],
    }).compile();

    interceptor = module.get(MapUserToSessionInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });
});
