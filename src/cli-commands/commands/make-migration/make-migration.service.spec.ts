import { Test, TestingModule } from '@nestjs/testing';
import { MakeMigrationService } from './make-migration.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('MakeMigrationService', () => {
  let service: MakeMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakeMigrationService,
        Logger,
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MakeMigrationService>(MakeMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
