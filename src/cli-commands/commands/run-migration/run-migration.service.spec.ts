import { Test, TestingModule } from '@nestjs/testing';
import { RunMigrationService } from './run-migration.service.js';
import { MigratorFactoryService } from '../../services/migrator-factory/migrator-factory.service.js';

describe('RunMigrationService', () => {
  let service: RunMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunMigrationService,
        { provide: MigratorFactoryService, useValue: {} },
      ],
    }).compile();

    service = module.get<RunMigrationService>(RunMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
