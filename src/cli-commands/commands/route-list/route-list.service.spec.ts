import { Test, TestingModule } from '@nestjs/testing';
import { RouteListService } from './route-list.service';
import { DatabaseHelperService } from '../../services/database-helper/database-helper.service';
import { Logger } from '@nestjs/common';

describe('RouteListService', () => {
  let service: RouteListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteListService,
        {
          provide: DatabaseHelperService,
          useValue: {},
        },
        Logger,
      ],
    }).compile();

    service = module.get<RouteListService>(RouteListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
