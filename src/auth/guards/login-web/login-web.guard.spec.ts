import { Test, TestingModule } from '@nestjs/testing';
import { LoginWebGuard } from './login-web.guard';

describe('LoginWebGuard', () => {
  let service: LoginWebGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoginWebGuard],
    }).compile();

    service = module.get<LoginWebGuard>(LoginWebGuard);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
