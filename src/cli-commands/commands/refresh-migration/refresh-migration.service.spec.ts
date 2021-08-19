import { Test, TestingModule } from '@nestjs/testing';
import { RefreshMigrationService } from './refresh-migration.service';
import { DatabaseHelperService } from '../../services/database-helper/database-helper.service';
import { Logger } from '@nestjs/common';
import { DropDatabaseService } from '../drop-database/drop-database.service';
import { CreateDatabaseService } from '../create-database/create-database.service';
import { RunMigrationService } from '../run-migration/run-migration.service';

describe('RefreshMigrationService', () => {
  let service: RefreshMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshMigrationService,
        {
          provide: DatabaseHelperService,
          useValue: {},
        },
        {
          provide: DropDatabaseService,
          useValue: {},
        },
        {
          provide: CreateDatabaseService,
          useValue: {},
        },
        {
          provide: RunMigrationService,
          useValue: {},
        },
        Logger,
      ],
    }).compile();

    service = module.get<RefreshMigrationService>(RefreshMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
