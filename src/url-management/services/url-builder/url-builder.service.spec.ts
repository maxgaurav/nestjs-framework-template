import { Test, TestingModule } from '@nestjs/testing';
import { UrlBuilderService } from './url-builder.service';
import { ConfigService } from '@nestjs/config';

describe('UrlBuilderService', () => {
  let service: UrlBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UrlBuilderService, ConfigService],
    }).compile();

    service = module.get<UrlBuilderService>(UrlBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
