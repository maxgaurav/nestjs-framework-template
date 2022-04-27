import { Test, TestingModule } from '@nestjs/testing';
import { TinkerService } from './tinker.service';

describe('TinkerService', () => {
  let service: TinkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TinkerService],
    }).compile();

    service = module.get<TinkerService>(TinkerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
