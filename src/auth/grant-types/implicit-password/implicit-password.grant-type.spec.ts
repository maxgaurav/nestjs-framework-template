import { ImplicitPasswordGrantType } from './implicit-password.grant-type';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../services/auth/auth.service';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';

describe('ImplicitPasswordGrantType', () => {
  let service: ImplicitPasswordGrantType;

  const authService: AuthService = {} as AuthService;
  const clientRepo: ClientRepoService = {} as ClientRepoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImplicitPasswordGrantType,
        {
          provide: ClientRepoService,
          useValue: clientRepo,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    service = await module.resolve<ImplicitPasswordGrantType>(
      ImplicitPasswordGrantType,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
