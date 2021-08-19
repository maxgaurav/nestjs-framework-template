import { Test, TestingModule } from '@nestjs/testing';
import { CreateDatabaseService } from './create-database.service';
import { DatabaseHelperService } from '../../services/database-helper/database-helper.service';
import { Logger } from '@nestjs/common';

describe('CreateDatabaseService', () => {
  let service: CreateDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDatabaseService,
        {
          provide: DatabaseHelperService,
          useValue: {},
        },
        Logger,
      ],
    }).compile();

    service = module.get<CreateDatabaseService>(CreateDatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
