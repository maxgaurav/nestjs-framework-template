import {
  HttpStatus,
  INestApplication,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { Sequelize, Transaction } from 'sequelize';
import { getConnectionToken } from '@nestjs/sequelize';
import { useContainer } from 'class-validator';
import { NotFoundConverterInterceptor } from '../src/helpers/interceptors/not-found-converter/not-found-converter.interceptor';
import { ContextInterceptor } from '../src/helpers/interceptors/context/context.interceptor';
import { ErrorValidationFormatFilter } from '../src/helpers/filters/error-validation-format/error-validation-format.filter';
import * as request from 'supertest';
import { TransactionProviderService } from '../src/common/services/transaction-provider/transaction-provider.service';
import { LoggingService } from '../src/services/logging/logging.service';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SessionConfigService } from '../src/session-manager/services/session-config/session-config.service';

/**
 * Sets basic e2e testing module of app
 */
export async function basicE2eSetup(): Promise<
  [NestExpressApplication, TestingModule]
> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  app.enableCors();

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory(errors: ValidationError[]) {
        return new UnprocessableEntityException(
          errors,
          'The given data was invalid.',
        );
      },
    }),
  );
  app.useGlobalInterceptors(
    app.get(NotFoundConverterInterceptor),
    new ContextInterceptor(),
  );

  app.useLogger(app.get<LoggingService>(LoggingService));

  app.use(await app.get<SessionConfigService>(SessionConfigService).session());

  app.useStaticAssets(join(process.cwd(), 'public'));
  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('hbs');

  app.useGlobalFilters(new ErrorValidationFormatFilter());
  return [await app.init(), moduleFixture];
}

export const createTransaction = async (
  app: INestApplication,
): Promise<Transaction> => {
  const connection: Sequelize = app.get<Sequelize>(getConnectionToken());
  const transaction = await connection.transaction();

  app
    .get<TransactionProviderService>(TransactionProviderService)
    .setParentTransaction(transaction);

  connection.beforeFind((options) => {
    options.transaction = options.transaction || transaction;
  });

  connection.beforeCreate((model, options) => {
    options.transaction = options.transaction || transaction;
  });

  connection.beforeUpdate((model, options) => {
    options.transaction = options.transaction || transaction;
  });

  connection.beforeDestroy((model, options) => {
    options.transaction = options.transaction || transaction;
  });

  return transaction;
};

export const checkValidationErrors = (res: request.Response) => {
  if (res.status === HttpStatus.UNPROCESSABLE_ENTITY) {
    console.error('Validation Errors', res.body);
  }
  expect(res.status).not.toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  return true;
};
