import { Test, TestingModule } from '@nestjs/testing';
import { RollbackMigrationService } from './rollback-migration.service';
import { DatabaseHelperService } from '../../services/database-helper/database-helper.service';
import { Logger } from '@nestjs/common';

describe('RollbackMigrationService', () => {
  let service: RollbackMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RollbackMigrationService,
        {
          provide: DatabaseHelperService,
          useValue: {},
        },
        Logger,
      ],
    }).compile();

    service = module.get<RollbackMigrationService>(RollbackMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
