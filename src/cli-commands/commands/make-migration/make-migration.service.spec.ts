import { Test, TestingModule } from '@nestjs/testing';
import { MakeMigrationService } from './make-migration.service';
import { LoggingService } from '../../../services/logging/logging.service';
import { ConfigService } from '@nestjs/config';

describe('MakeMigrationService', () => {
  let service: MakeMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakeMigrationService,
        LoggingService,
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
