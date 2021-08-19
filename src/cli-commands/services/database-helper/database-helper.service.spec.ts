import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseHelperService } from './database-helper.service';
import { ConfigService } from '@nestjs/config';

describe('DatabaseHelperService', () => {
  let service: DatabaseHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseHelperService, ConfigService],
    }).compile();

    service = module.get<DatabaseHelperService>(DatabaseHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
