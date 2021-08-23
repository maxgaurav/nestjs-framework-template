import { Test, TestingModule } from '@nestjs/testing';
import { WebGuard } from './web.guard';

describe('WebGuard', () => {
  let service: WebGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebGuard],
    }).compile();

    service = module.get<WebGuard>(WebGuard);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
