import { CheckShowPasswordGuard } from './check-show-password.guard';
import { Test, TestingModule } from '@nestjs/testing';

describe('CheckShowPasswordGuard', () => {
  let guard: CheckShowPasswordGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [CheckShowPasswordGuard],
    }).compile();

    guard = await module.resolve(CheckShowPasswordGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
