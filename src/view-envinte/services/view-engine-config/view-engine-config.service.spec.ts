import { Test, TestingModule } from '@nestjs/testing';
import { ViewEngineConfigService } from './view-engine-config.service';

describe('ViewEngineConfigService', () => {
  let service: ViewEngineConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ViewEngineConfigService],
    }).compile();

    service = module.get<ViewEngineConfigService>(ViewEngineConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
