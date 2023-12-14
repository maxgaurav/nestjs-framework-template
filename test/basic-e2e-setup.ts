import {
  HttpStatus,
  INestApplication,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { Sequelize, Transaction } from 'sequelize';
import { getConnectionToken } from '@nestjs/sequelize';
import { useContainer } from 'class-validator';
import { NotFoundConverterInterceptor } from '../src/helpers/interceptors/not-found-converter/not-found-converter.interceptor';
import { ContextInterceptor } from '../src/helpers/interceptors/context/context.interceptor';
import { ErrorValidationFormatFilter } from '../src/helpers/filters/error-validation-format/error-validation-format.filter';
import request from 'supertest';
import { LoggingService } from '../src/services/logging/logging.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SessionConfigService } from '../src/session-manager/services/session-config/session-config.service';
import { TransactionProviderService } from '../src/transaction-manager/services/transaction-provider/transaction-provider.service';
import { RedirectFromLoginFilter } from '../src/session-manager/filters/redirect-to-login/redirect-to-login.filter';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import flash from 'connect-flash';
import { SessionMapPreviousUrlInterceptor } from '../src/session-manager/interceptors/session-map-previous-url/session-map-previous-url-interceptor.service';
import { SetupIntendInterceptor } from '../src/session-manager/interceptors/setup-intend/setup-intend.interceptor';
import helmet from 'helmet';
import { ViewConfig } from '../src/environment/environment-types.interface';
import { ConfigService } from '@nestjs/config';

/**
 * Hook for overriding the testing module
 */
export type TestingModuleCreatePreHook = (
  moduleBuilder: TestingModuleBuilder,
) => TestingModuleBuilder;

/**
 * Hook for adding items to nest application
 */
export type TestingAppCreatePreHook = (
  app: NestExpressApplication,
) => Promise<void>;

/**
 * Sets basic e2e testing module of app
 */
export async function basicE2eSetup(
  config: {
    moduleBuilderHook?: TestingModuleCreatePreHook;
    appInitHook?: TestingAppCreatePreHook;
  } = {},
): Promise<[NestExpressApplication, TestingModule]> {
  let moduleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  if (!!config.moduleBuilderHook) {
    moduleBuilder = config.moduleBuilderHook(moduleBuilder);
  }

  const moduleFixture: TestingModule = await moduleBuilder.compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  app.enableCors();
  app.use(helmet());

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
  app.useGlobalFilters(new ErrorValidationFormatFilter());
  app.useGlobalFilters(app.get(RedirectFromLoginFilter));

  app.use(await app.get<SessionConfigService>(SessionConfigService).session());
  app.use(flash());
  app.useGlobalInterceptors(
    app.get(NotFoundConverterInterceptor),
    app.get(SessionMapPreviousUrlInterceptor),
    app.get(SetupIntendInterceptor),
    new ContextInterceptor(),
  );

  app.useLogger(app.get<LoggingService>(LoggingService));

  const viewConfig = app
    .get<ConfigService>(ConfigService)
    .get<ViewConfig>('view');
  app.useStaticAssets(viewConfig.publicPath);
  app.setBaseViewsDir(viewConfig.viewPath);
  app.setViewEngine('twig');

  app.useGlobalFilters(new ErrorValidationFormatFilter());

  if (config.appInitHook) {
    await config.appInitHook(app);
  }

  return [await app.init(), moduleFixture];
}

/**
 * Creates a transaction and sets it in global application level
 * @param app
 */
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

/**
 * A helper to check if response is not a validation error
 * @param res
 */
export const checkValidationErrors = (res: request.Response) => {
  if (res.status === HttpStatus.UNPROCESSABLE_ENTITY) {
    console.error('Validation Errors', res.body);
  }
  expect(res.status).not.toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  return true;
};
