import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Transaction, TransactionOptions } from 'sequelize';

@Injectable()
export class TransactionProviderService {
  private parentTransaction: Transaction | null = null;

  constructor(@InjectConnection() public readonly connection: Sequelize) {}

  /**
   * Creates transaction
   * @param options
   */
  public create(options: TransactionOptions = {}): Promise<Transaction> {
    options.transaction = options.transaction || this.parentTransaction;
    return this.connection.transaction(options);
  }

  /**
   * Creates a managed transaction
   * @param callback
   * @param options
   */
  public createManaged<T = any>(
    callback: (transaction: Transaction) => PromiseLike<T>,
    options: TransactionOptions = {},
  ): Promise<T> {
    options.transaction = options.transaction || this.getParentTransaction();
    return this.connection.transaction(options, callback);
  }

  /**
   * Set parent transaction
   * @param transaction
   */
  public setParentTransaction(transaction: Transaction | null): void {
    this.parentTransaction = transaction;
  }

  public getParentTransaction(): Transaction | null {
    return this.parentTransaction;
  }
}
