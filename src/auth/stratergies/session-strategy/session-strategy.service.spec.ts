import { Test, TestingModule } from '@nestjs/testing';
import { SessionStrategyService } from './session-strategy.service';

describe('LocalStrategyService', () => {
  let service: SessionStrategyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionStrategyService],
    }).compile();

    service = module.get<SessionStrategyService>(SessionStrategyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
