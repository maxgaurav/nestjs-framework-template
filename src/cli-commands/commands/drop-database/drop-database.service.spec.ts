import { Test, TestingModule } from '@nestjs/testing';
import { DropDatabaseService } from './drop-database.service';
import { getConnectionToken } from '@nestjs/sequelize';

describe('DropDatabaseService', () => {
  let service: DropDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DropDatabaseService,
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
