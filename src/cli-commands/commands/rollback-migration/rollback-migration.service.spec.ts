import { Test, TestingModule } from '@nestjs/testing';
import { RollbackMigrationService } from './rollback-migration.service.js';
import { MigratorFactoryService } from '../../services/migrator-factory/migrator-factory.service.js';

describe('RollbackMigrationService', () => {
  let service: RollbackMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RollbackMigrationService,
        { provide: MigratorFactoryService, useValue: {} },
      ],
    }).compile();

    service = module.get<RollbackMigrationService>(RollbackMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
