import { Test, TestingModule } from '@nestjs/testing';
import { DropDatabaseService } from './drop-database.service';
import { DatabaseHelperService } from '../../services/database-helper/database-helper.service';
import { Logger } from '@nestjs/common';

describe('DropDatabaseService', () => {
  let service: DropDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DropDatabaseService,
        {
          provide: DatabaseHelperService,
          useValue: {},
        },
        Logger,
      ],
    }).compile();

    service = module.get<DropDatabaseService>(DropDatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
