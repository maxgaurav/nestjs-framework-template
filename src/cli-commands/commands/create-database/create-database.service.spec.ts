import { Test, TestingModule } from '@nestjs/testing';
import { CreateDatabaseService } from './create-database.service';
import { LoggingService } from '../../../services/logging/logging.service';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/sequelize';

describe('CreateDatabaseService', () => {
  let service: CreateDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDatabaseService,
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

    service = module.get<CreateDatabaseService>(CreateDatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
