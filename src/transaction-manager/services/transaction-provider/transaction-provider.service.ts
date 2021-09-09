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
