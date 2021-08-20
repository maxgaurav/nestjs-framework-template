import { TransactionInterceptor } from './transaction.interceptor';
import { of } from 'rxjs';

describe('TransactionInterceptor', () => {
  it('should be defined', () => {
    expect(new TransactionInterceptor({} as any)).toBeDefined();
  });

  it('should create transaction and commit on success', async () => {
    const requestSample = {};
    const context = {
      switchToHttp: () => ({
        getRequest: () => requestSample,
      }),
    };

    const transaction = {
      commit: () => ({}),
    };

    const connection = {
      create: () => ({}),
    };

    const transactionSpy = jest
      .spyOn(connection, 'create')
      .mockImplementation(() => Promise.resolve(transaction));

    const commitSpy = jest
      .spyOn(transaction, 'commit')
      .mockImplementation(() => Promise.resolve(true));

    const nextHandler = {
      handle: () => of(true),
    };

    const interceptor = new TransactionInterceptor(connection as any);
    const result = await interceptor
      .intercept(context as any, nextHandler)
      .toPromise();

    expect(result).toEqual(true);
    expect(transactionSpy).toHaveBeenCalled();
    expect(requestSample).toEqual(
      expect.objectContaining({
        scopeTransaction: transaction,
      }),
    );
    expect(commitSpy).toHaveBeenCalled();
  });
});
