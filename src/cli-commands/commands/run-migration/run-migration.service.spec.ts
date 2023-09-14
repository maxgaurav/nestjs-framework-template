import { Test, TestingModule } from '@nestjs/testing';
import { RunMigrationService } from './run-migration.service';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/sequelize';
import { Logger } from '@nestjs/common';

describe('RunMigrationService', () => {
  let service: RunMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunMigrationService,
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

    service = module.get<RunMigrationService>(RunMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
