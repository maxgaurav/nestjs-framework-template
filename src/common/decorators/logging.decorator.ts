import { INestApplication, Logger } from '@nestjs/common';

function parseMessage(
  message: string | ((args: any[]) => string),
  args: any[],
): string {
  return typeof message === 'string' ? message : message(args);
}

let applicationContext: INestApplication | null = null;

export function registerApplicationContext(application: INestApplication) {
  applicationContext = application;
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
  return logger;
}

export const LoggingDecorator = (message: {
  messageBefore: string | ((args: any[]) => string);
  ActivityTypeBefore?: 'debug' | 'log' | 'error' | 'warn';
  messageAfter?: string | ((args: any[]) => string) | undefined;
  ActivityTypeAfter?: 'debug' | 'log' | 'error' | 'warn';
}) => {
  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor,
  ) => {
    // @todo parallelize and allow logging to be on separate thread somehow so that there is no impact in performance
    const originalMethod = propertyDescriptor.value;

    propertyDescriptor.value = function (...args: any[]) {
      getLogger()[message.ActivityTypeBefore || 'debug'](
        parseMessage(message.messageBefore, args),
        target.constructor.name,
      );
      const result = originalMethod.apply(this, args);

      if (!message.messageAfter) {
        return result;
      }

      if (result instanceof Promise) {
        return result.then((mainResult) => {
          getLogger()[message.ActivityTypeAfter || 'debug'](
            parseMessage(message.messageAfter, args),
            target.constructor.name,
          );
          return mainResult;
        });
      }

      return result;
    };
  };
};