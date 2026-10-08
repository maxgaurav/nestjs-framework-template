import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  INestApplication,
  NestInterceptor,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { Transaction } from 'sequelize';
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
import { Observable } from 'rxjs';

/**
 * Marker error used to force a managed Sequelize transaction to roll back
 * after a successful test callback.
 */
class TestingTransactionRollbackError extends Error {
  constructor() {
    super('Intentional rollback of e2e test transaction');
    this.name = 'TestingTransactionRollbackError';
  }
}

/**
 * Active parent transaction for the current {@link managedTransaction} scope.
 * Read by {@link TestingTransactionInterceptor} on each HTTP request.
 */
let activeTestingTransaction: Transaction | null = null;

/**
 * Sets the active test parent transaction on {@link TransactionProviderService}
 * for each request, so route-level {@link TransactionInterceptor} creates a
 * nested child transaction while the rest of the app flow stays unchanged.
 */
export class TestingTransactionInterceptor implements NestInterceptor {
  constructor(
    private readonly transactionProvider: TransactionProviderService,
  ) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (activeTestingTransaction) {
      this.transactionProvider.setParentTransaction(activeTestingTransaction);
    }

    return next.handle();
  }
}

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
    new TestingTransactionInterceptor(
      app.get(TransactionProviderService),
    ),
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
 * Runs `callback` inside a managed Sequelize transaction that always rolls
 * back (success or failure), for transactional e2e tests.
 *
 * While the callback runs, HTTP requests via supertest pick up the parent
 * transaction through {@link TestingTransactionInterceptor}, so
 * {@link TransactionInterceptor} opens a nested child transaction.
 *
 * @param app Nest application (or testing module holder of TransactionProviderService)
 * @param callback Test body; receives the parent transaction for direct DB work
 */
export const managedTransaction = async <T>(
  app: INestApplication,
  callback: (transaction: Transaction) => Promise<T>,
): Promise<T> => {
  const transactionProvider = app.get(TransactionProviderService);
  let result!: T;

  try {
    await transactionProvider.createManaged(async (transaction) => {
      activeTestingTransaction = transaction;
      try {
        result = await callback(transaction);
        // Force rollback after a successful test body.
        throw new TestingTransactionRollbackError();
      } finally {
        activeTestingTransaction = null;
        transactionProvider.setParentTransaction(null);
      }
    });
  } catch (error) {
    if (error instanceof TestingTransactionRollbackError) {
      return result;
    }
    throw error;
  }

  return result;
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
