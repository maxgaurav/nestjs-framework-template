import { Test, TestingModule } from '@nestjs/testing';
import { RollbackMigrationService } from './rollback-migration.service';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/sequelize';
import { Logger } from '@nestjs/common';

describe('RollbackMigrationService', () => {
  let service: RollbackMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RollbackMigrationService,
        Logger,
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
