import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { CallbackExecutioner } from '../../../interfaces/transaction-callback.interface';

@Injectable()
export class EventRegisterCallbackService {
  /**
   * Register callbacks for transaction. If transaction does not exists then fires synchronously
   * @param callback
   * @param transaction
   */
  public registerEventCallBacks<T = unknown>(
    callback: () => Promise<void | T>,
    transaction?: Transaction,
  ): CallbackExecutioner<T> {
    if (transaction) {
      transaction.afterCommit(async () => {
        await callback();
      });
      return () => Promise.resolve() as unknown as T;
    }

    return () => callback() as unknown as T;
  }
}
