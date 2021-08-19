import { Transaction } from 'sequelize';

export interface TransactionCallback {
  registerEventCallBacks(
    callback: () => Promise<any>,
    transaction?: Transaction,
  ): CallbackExecutioner;
}

export type CallbackExecutioner = () => Promise<any>;
