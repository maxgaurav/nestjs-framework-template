import { Test, TestingModule } from '@nestjs/testing';
import { RollbackMigrationService } from './rollback-migration.service';
import { LoggingService } from '../../../services/logging/logging.service';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/sequelize';

describe('RollbackMigrationService', () => {
  let service: RollbackMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RollbackMigrationService,
        LoggingService,
        {
          provide: ConfigService,
          useValue: {},
        },
        {
          provide: getConnectionToken(),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RollbackMigrationService>(RollbackMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
