import { Test, TestingModule } from '@nestjs/testing';
import { JwtTokenManagerService } from './jwt-token-manager.service';

describe('JwtTokenManagerService', () => {
  let service: JwtTokenManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtTokenManagerService],
    }).compile();

    service = module.get<JwtTokenManagerService>(JwtTokenManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
