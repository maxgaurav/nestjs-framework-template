import { Transaction } from 'sequelize';

export interface TransactionCallback {
  registerEventCallBacks<T = unknown>(
    callback: () => Promise<T> | T,
    transaction?: Transaction,
  ): CallbackExecutioner<T>;
}

export type CallbackExecutioner<T = unknown> = () => Promise<T> | T;
