import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { CallbackExecutioner } from '../../interfaces/transaction-callback.interface';

@Injectable()
export class EventRegisterCallbackService {
  /**
   * Register callbacks for transaction. If transaction does not exists then fires synchronously
   * @param callback
   * @param transaction
   */
  public registerEventCallBacks(
    callback: () => Promise<void | any>,
    transaction?: Transaction | undefined,
  ): CallbackExecutioner {
    if (!!transaction) {
      transaction.afterCommit(async () => {
        await callback();
      });
      return () => Promise.resolve();
    }

    return () => callback();
  }
}
