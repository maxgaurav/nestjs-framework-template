import { Test, TestingModule } from '@nestjs/testing';
import { RefreshMigrationService } from './refresh-migration.service';
import { RunMigrationService } from '../run-migration/run-migration.service';
import { LoggingService } from '../../../services/logging/logging.service';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/sequelize';

describe('RefreshMigrationService', () => {
  let service: RefreshMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshMigrationService,
        LoggingService,
        {
          provide: ConfigService,
          useValue: {},
        },
        {
          provide: getConnectionToken(),
          useValue: {},
        },
        {
          provide: RunMigrationService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RefreshMigrationService>(RefreshMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
