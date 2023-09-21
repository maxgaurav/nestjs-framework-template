import { TransactionInterceptor } from './transaction.interceptor';
import { firstValueFrom, of } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionProviderService } from '../../services/transaction-provider/transaction-provider.service';

describe('TransactionInterceptor', () => {
  let interceptor: TransactionInterceptor;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TransactionInterceptor,
        {
          provide: TransactionProviderService,
          useValue: {
            createManaged: () => null,
          },
        },
      ],
    }).compile();

    interceptor = module.get<TransactionInterceptor>(TransactionInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should create transaction and commit on success', async () => {
    const requestSample = {};
    const context = {
      switchToHttp: () => ({
        getRequest: () => requestSample,
      }),
    };
    const transactionManager = module.get<TransactionProviderService>(
      TransactionProviderService,
    );
    let callbackCalled = false;

    const transactionSpy = jest
      .spyOn(transactionManager, 'createManaged')
      .mockImplementation((callback: (value: any) => any) => {
        callbackCalled = true;
        return callback('transaction');
      });

    const nextHandler = {
      handle: () => of(true),
    };

    const result = await firstValueFrom(
      interceptor.intercept(context as any, nextHandler),
    );

    expect(result).toEqual(true);
    expect(transactionSpy).toHaveBeenCalled();
    expect(requestSample).toEqual(
      expect.objectContaining({
        scopeTransaction: 'transaction',
      }),
    );
    expect(callbackCalled).toEqual(true);
  });
});
