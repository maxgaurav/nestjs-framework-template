import { Test, TestingModule } from '@nestjs/testing';
import { TransactionProviderService } from './transaction-provider.service';
import { getConnectionToken } from '@nestjs/sequelize';

describe('TransactionProviderService', () => {
  let service: TransactionProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionProviderService,
        {
          provide: getConnectionToken(),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TransactionProviderService>(
      TransactionProviderService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
