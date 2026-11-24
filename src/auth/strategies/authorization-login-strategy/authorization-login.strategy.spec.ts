import { AuthorizationLoginStrategy } from './authorization-login.strategy.js';
import { Test, TestingModule } from '@nestjs/testing';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service.js';
import { AuthService } from '../../services/auth/auth.service.js';

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
