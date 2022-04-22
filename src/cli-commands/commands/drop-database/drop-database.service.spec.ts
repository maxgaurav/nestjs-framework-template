import { Test, TestingModule } from '@nestjs/testing';
import { DropDatabaseService } from './drop-database.service';
import { LoggingService } from '../../../services/logging/logging.service';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/sequelize';

describe('DropDatabaseService', () => {
  let service: DropDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DropDatabaseService,
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

    service = module.get<DropDatabaseService>(DropDatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
