import { Test, TestingModule } from '@nestjs/testing';
import { SetupClusterService } from './setup-cluster.service';
import { ConfigService } from '@nestjs/config';

describe('SetupClusterService', () => {
  let service: SetupClusterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SetupClusterService, ConfigService],
    }).compile();

    service = module.get<SetupClusterService>(SetupClusterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
