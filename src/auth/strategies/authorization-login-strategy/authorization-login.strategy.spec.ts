import { AuthorizationLoginStrategy } from './authorization-login.strategy';
import { Test, TestingModule } from '@nestjs/testing';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { AuthService } from '../../services/auth/auth.service';

describe('AuthorizationLoginStrategy', () => {
  let service: AuthorizationLoginStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationLoginStrategy,
        {
          provide: HashEncryptService,
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthorizationLoginStrategy>(
      AuthorizationLoginStrategy,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
