import { Logger } from '@nestjs/common';
import type { Transaction } from 'sequelize';
import { EventRegisterCallbackService } from './event-register-callback.service.js';

describe('EventRegisterCallbackService', () => {
  const service = new EventRegisterCallbackService();

  const transactionDouble = () => {
    const handlers: (() => Promise<void> | void)[] = [];
    return {
      transaction: {
        afterCommit: (handler: () => Promise<void> | void) =>
          handlers.push(handler),
      } as unknown as Transaction,
      commit: () =>
        Promise.all(handlers.map((handler) => Promise.resolve(handler()))),
    };
  };

  // Regression: without a transaction the callback only ran when the caller invoked the
  // returned executioner, although the contract (AGENTS.md) says it runs immediately
  it('runs the callback immediately when there is no transaction', () => {
    const callback = vi.fn(() => 'done');

    service.registerEventCallBacks(callback);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('returns the callback result through the executioner, without running it twice', async () => {
    const callback = vi.fn(() => Promise.resolve(42));

    const executioner = service.registerEventCallBacks(callback);

    expect(await executioner()).toEqual(42);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('runs the callback only after the transaction commits', async () => {
    const { transaction, commit } = transactionDouble();
    const callback = vi.fn(() => Promise.resolve());

    const executioner = service.registerEventCallBacks(callback, transaction);

    expect(callback).not.toHaveBeenCalled();
    await executioner();
    expect(callback).not.toHaveBeenCalled();
    await commit();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('logs a failing callback instead of leaving an unhandled rejection', async () => {
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const executioner = service.registerEventCallBacks(() =>
      Promise.reject(new Error('listener broke')),
    );

    await expect(executioner()).rejects.toThrow('listener broke');
    expect(logSpy).toHaveBeenCalledWith(
      'Event callback failed',
      expect.stringContaining('listener broke'),
    );
  });

  it('logs a callback that throws synchronously', async () => {
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const executioner = service.registerEventCallBacks(() => {
      throw new Error('sync failure');
    });

    await expect(executioner()).rejects.toThrow('sync failure');
    expect(logSpy).toHaveBeenCalled();
  });

  it('logs a failing after-commit callback', async () => {
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { transaction, commit } = transactionDouble();

    service.registerEventCallBacks(
      () => Promise.reject(new Error('after commit')),
      transaction,
    );
    await commit();

    expect(logSpy).toHaveBeenCalledWith(
      'Event callback failed',
      expect.stringContaining('after commit'),
    );
  });
});
