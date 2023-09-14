import { Test, TestingModule } from '@nestjs/testing';
import { CreateDatabaseService } from './create-database.service';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/sequelize';
import { Logger } from '@nestjs/common';

describe('CreateDatabaseService', () => {
  let service: CreateDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDatabaseService,
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

    service = module.get<CreateDatabaseService>(CreateDatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
