import { Test, TestingModule } from '@nestjs/testing';
import { RunMigrationService } from './run-migration.service';
import { LoggingService } from '../../../services/logging/logging.service';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/sequelize';

describe('RunMigrationService', () => {
  let service: RunMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunMigrationService,
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

    service = module.get<RunMigrationService>(RunMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
