import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  INestApplication,
  NestInterceptor,
  Type,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import {
  InMemoryDisk,
  STORAGE_MODULE_OPTIONS,
  type StorageModuleOptions,
} from '@nestjs/storage';
import { Transaction } from 'sequelize';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import request from 'supertest';
import { Observable } from 'rxjs';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from '../src/app.module.js';
import { NotFoundConverterInterceptor } from '../src/helpers/interceptors/not-found-converter/not-found-converter.interceptor.js';
import { ContextInterceptor } from '../src/helpers/interceptors/context/context.interceptor.js';
import { ErrorValidationFormatFilter } from '../src/helpers/filters/error-validation-format/error-validation-format.filter.js';
import { LoggingService } from '../src/services/logging/logging.service.js';
import { TransactionProviderService } from '../src/transaction-manager/services/transaction-provider/transaction-provider.service.js';
import { RedirectFromLoginFilter } from '../src/session-manager/filters/redirect-to-login/redirect-to-login.filter.js';
import { SessionMapPreviousUrlInterceptor } from '../src/session-manager/interceptors/session-map-previous-url/session-map-previous-url-interceptor.service.js';
import { SetupIntendInterceptor } from '../src/session-manager/interceptors/setup-intend/setup-intend.interceptor.js';
import {
  StorageConfig,
  ViewConfig,
} from '../src/environment/environment-types.interface.js';
import { StorageErrorFilter } from '../src/helpers/filters/storage-error/storage-error.filter.js';
import { StorageDisks } from '../src/file-management/storage-disks.js';
import { registerPgTypeParsers } from '../src/helpers/pg-type-parsers/pg-type-parsers.js';
import {
  registerSequelizeCls,
  sequelizeNamespace,
} from '../src/helpers/sequelize-namespace/sequelize-namespace.js';

// Mirror the Sequelize setup done in src/main.ts
registerPgTypeParsers();
registerSequelizeCls();

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
 * Read by the CLS request middleware and {@link TestingTransactionInterceptor}.
 */
let activeTestingTransaction: Transaction | null = null;

/**
 * Runs every request inside the active test transaction (if any), so all queries of
 * the request — guards, validators, repositories, listeners — join it through
 * cls-hooked and see the data the test created.
 */
const testingTransactionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const transaction = activeTestingTransaction;
  if (!transaction) {
    next();
    return;
  }

  sequelizeNamespace.bindEmitter(req);
  sequelizeNamespace.bindEmitter(res);
  sequelizeNamespace.run(() => {
    sequelizeNamespace.set('transaction', transaction);
    next();
  });
};

/**
 * Sets the active test parent transaction on {@link TransactionProviderService}
 * for each request, so route-level `TransactionInterceptor` creates a nested
 * child transaction (savepoint) while the rest of the app flow stays unchanged.
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
 * Sets basic e2e testing module of app. Mirrors the bootstrap in src/main.ts.
 */
export async function basicE2eSetup(
  config: {
    moduleBuilderHook?: TestingModuleCreatePreHook;
    appInitHook?: TestingAppCreatePreHook;
    /**
     * Root module of the application under test; a feature test may boot only the
     * feature module and the infrastructure it needs
     */
    rootModule?: Type;
  } = {},
): Promise<[NestExpressApplication, TestingModule]> {
  const rootModule = config.rootModule ?? AppModule;
  let moduleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [rootModule],
  })
    // Same disk names as the app, kept in memory so tests never touch storage/ or S3
    .overrideProvider(STORAGE_MODULE_OPTIONS)
    .useFactory({
      factory: (configService: ConfigService): StorageModuleOptions => {
        const storage = configService.getOrThrow<StorageConfig>('storage');
        return {
          default: StorageDisks.Private,
          disks: {
            [StorageDisks.Private]: new InMemoryDisk({
              signedUrls: {
                baseUrl: `${storage.signedUrlBase}/${StorageDisks.Private}`,
                keys: storage.signingKeys,
              },
            }),
            [StorageDisks.Public]: new InMemoryDisk({
              publicUrl: storage.publicUrl,
            }),
          },
        };
      },
      inject: [ConfigService],
    });

  if (config.moduleBuilderHook) {
    moduleBuilder = config.moduleBuilderHook(moduleBuilder);
  }

  const moduleFixture: TestingModule = await moduleBuilder.compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  app.useLogger(app.get<LoggingService>(LoggingService));
  app.enableCors();
  app.use(helmet());
  app.use(testingTransactionMiddleware);

  useContainer(app.select(rootModule), { fallbackOnErrors: true });

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
  app.useGlobalFilters(
    new StorageErrorFilter(app.get(HttpAdapterHost).httpAdapter),
  );
  app.useGlobalFilters(app.get(RedirectFromLoginFilter));
  app.enableVersioning({ type: VersioningType.URI, prefix: 'api/v' });

  app.useGlobalInterceptors(
    new TestingTransactionInterceptor(app.get(TransactionProviderService)),
    app.get(NotFoundConverterInterceptor),
    app.get(SessionMapPreviousUrlInterceptor),
    app.get(SetupIntendInterceptor),
    new ContextInterceptor(),
  );

  const viewConfig = app
    .get<ConfigService>(ConfigService)
    .getOrThrow<ViewConfig>('view');
  app.useStaticAssets(viewConfig.publicPath);
  app.setBaseViewsDir(viewConfig.viewPath);
  app.setViewEngine('twig');

  if (config.appInitHook) {
    await config.appInitHook(app);
  }

  // Listen here, outside any test transaction. Otherwise supertest starts the server lazily
  // on the first request, the server inherits whatever CLS context that request ran in, and
  // transaction scoping works by accident. With an already-listening server, the request
  // middleware above is the only thing that puts a request inside the test transaction.
  await app.listen(0);

  return [app, moduleFixture];
}

/**
 * Runs `callback` inside a managed Sequelize transaction that always rolls
 * back (success or failure), for transactional e2e tests.
 *
 * While the callback runs:
 * - direct model/repository calls join the transaction through cls-hooked;
 * - supertest requests run inside it too (see the request middleware), and
 *   route-level `TransactionInterceptor` opens a nested child transaction.
 *
 * @param app Nest application
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
  if (res.status === Number(HttpStatus.UNPROCESSABLE_ENTITY)) {
    console.error('Validation Errors', res.body);
  }
  expect(res.status).not.toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  return true;
};
