import { Test, TestingModule } from '@nestjs/testing';
import { RouteListService } from './route-list.service';
import { Logger } from '@nestjs/common';

describe('RouteListService', () => {
  let service: RouteListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RouteListService, Logger],
    }).compile();

    service = module.get<RouteListService>(RouteListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
