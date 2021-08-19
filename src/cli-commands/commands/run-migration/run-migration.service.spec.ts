import { Test, TestingModule } from '@nestjs/testing';
import { RunMigrationService } from './run-migration.service';
import { DatabaseHelperService } from '../../services/database-helper/database-helper.service';
import { Logger } from '@nestjs/common';

describe('RunMigrationService', () => {
  let service: RunMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunMigrationService,
        {
          provide: DatabaseHelperService,
          useValue: {},
        },
        Logger,
      ],
    }).compile();

    service = module.get<RunMigrationService>(RunMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
