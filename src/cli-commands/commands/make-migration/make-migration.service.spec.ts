import { Test, TestingModule } from '@nestjs/testing';
import { MakeMigrationService } from './make-migration.service';
import { DatabaseHelperService } from '../../services/database-helper/database-helper.service';
import { Logger } from '@nestjs/common';

describe('MakeMigrationService', () => {
  let service: MakeMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakeMigrationService,
        {
          provide: DatabaseHelperService,
          useValue: {},
        },
        Logger,
      ],
    }).compile();

    service = module.get<MakeMigrationService>(MakeMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
