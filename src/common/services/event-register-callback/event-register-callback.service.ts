import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { CallbackExecutioner } from '../../../interfaces/transaction-callback.interface.js';

@Injectable()
export class EventRegisterCallbackService {
  private readonly logger = new Logger(EventRegisterCallbackService.name);

  /**
   * Runs `callback` after `transaction` commits, or **immediately** when there is no
   * transaction.
   *
   * The returned executioner gives access to the outcome: without a transaction it returns the
   * callback's result (a promise); with one it resolves at once, because a rolled-back
   * transaction never runs the callback and awaiting it would hang. Callers do not need to
   * invoke it for the callback to run.
   */
  public registerEventCallBacks<T = unknown>(
    callback: () => Promise<void | T> | void | T,
    transaction?: Transaction,
  ): CallbackExecutioner<T> {
    if (transaction) {
      transaction.afterCommit(async () => {
        try {
          await callback();
        } catch (error) {
          this.logFailure(error);
        }
      });
      return () => Promise.resolve() as unknown as T;
    }

    const result = this.runNow(callback);
    // Callers may ignore the executioner: log a failure instead of an unhandled rejection
    result.catch((error: unknown) => this.logFailure(error));
    return () => result as unknown as T;
  }

  private runNow<T>(
    callback: () => Promise<void | T> | void | T,
  ): Promise<void | T> {
    try {
      return Promise.resolve(callback());
    } catch (error) {
      return Promise.reject(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private logFailure(error: unknown): void {
    this.logger.error(
      'Event callback failed',
      error instanceof Error ? error.stack : String(error),
    );
  }
}
