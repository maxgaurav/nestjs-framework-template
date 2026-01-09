import { Logger } from '@nestjs/common';
import { applicationContext } from '../application-context';

function parseMessage(
  message: string | ((args: any[]) => string),
  args: any[],
): string {
  return typeof message === 'string' ? message : message(args);
}

let logger: Logger | null = null;

function getLogger(): Logger | Console {
  if (!applicationContext) {
    return console;
  }

  if (!!logger) {
    return logger;
  }

  logger = applicationContext.get(Logger);
  return logger as never;
}

export const LoggingDecorator = (message: {
  messageBefore: string | ((args: any[]) => string);
  LogTypeBefore?: 'debug' | 'log' | 'error' | 'warn';
  messageAfter?: string | ((args: any[]) => string) | undefined;
  LogTypeAfter?: 'debug' | 'log' | 'error' | 'warn';
}) => {
  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor,
  ) => {
    // @todo parallelize and allow logging to be on separate thread somehow so that there is no impact in performance
    const originalMethod = propertyDescriptor.value;

    propertyDescriptor.value = function (...args: any[]) {
      getLogger()[message.LogTypeBefore || 'debug'](
        parseMessage(message.messageBefore, args),
        target.constructor.name,
      );
      const result = originalMethod.apply(this, args);

      if (!message.messageAfter) {
        return result;
      }

      if (result instanceof Promise) {
        return result.then((mainResult) => {
          getLogger()[message.LogTypeAfter || 'debug'](
            parseMessage(message.messageAfter as never, args),
            target.constructor.name,
          );
          return mainResult;
        });
      }

      getLogger()[message.LogTypeAfter || 'debug'](
        parseMessage(message.messageAfter, args),
        target.constructor.name,
      );

      return result;
    };
  };
};
