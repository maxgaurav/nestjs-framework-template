# 02 — Jest → Vitest, and an e2e setup with cls-hooked transactions

**Status: not started**

Docs: https://docs.nestjs.com/fundamentals/testing. Nest 12 ESM starters use Vitest, and
`@nestjs/testing` works with any runner.

Goal: replace Jest with Vitest for unit and e2e tests while still on Nest 11 / CJS. Rebuild
`test/basic-e2e-setup.ts` so that **every query during a test, including those made by guards,
validators, repositories and listeners, joins one rolled-back transaction**, the way wisekeep does.

## 2.1 Install and config

- [ ] `npm i -D vitest@^5 @vitest/coverage-v8@^5`
- [ ] `npm rm jest @types/jest @swc/jest ts-jest`, and drop the `jest` block from `package.json`.
- [ ] **Decorator metadata spike.** Nest DI and Swagger need `emitDecoratorMetadata`, and plain
      esbuild cannot emit it.
  - [ ] Try Vite's built-in oxc transform first, with legacy decorators and `emitDecoratorMetadata`
        turned on.
  - [ ] If DI fails (`Nest can't resolve dependencies of X (?)`), use `unplugin-swc`:
        `npm i -D unplugin-swc @swc/core` and `swc.vite({ module: { type: 'es6' } })` with the
        legacy-decorator and decorator-metadata options inline (`swcrc: false`). Then delete
        `.swcrc`.
  - [ ] Record which one was chosen and why at the end of this file.
- [ ] `vitest.config.mts` (the config file is ESM even while the app is CJS):

  ```ts
  import { defineConfig } from 'vitest/config';
  // import swc from 'unplugin-swc';   // only if the oxc spike fails

  export default defineConfig({
    // plugins: [swc.vite({ module: { type: 'es6' } })],
    test: {
      globals: true,
      environment: 'node',
      pool: 'forks',                // cls-hooked + async_hooks: one process per worker, not threads
      projects: [
        {
          extends: true,
          test: { name: 'unit', include: ['src/**/*.spec.ts'] },
        },
        {
          extends: true,
          test: {
            name: 'e2e',
            include: ['test/**/*.e2e-spec.ts'],
            setupFiles: ['test/e2e-env.ts'],
            fileParallelism: false, // one shared test DB; enable later if suites stay independent
            testTimeout: 30_000,
            hookTimeout: 30_000,
          },
        },
      ],
      coverage: {
        provider: 'v8',
        reportsDirectory: 'coverage',
        include: ['src/**/*.ts'],
        exclude: [/* port the current jest collectCoverageFrom "!" entries */],
      },
    },
  });
  ```

- [ ] Delete `test/jest-e2e.json`.
- [ ] tsconfig: `"types": ["node", "vitest/globals"]`.
- [ ] Scripts:

  ```jsonc
  "test": "vitest run --project unit",
  "test:watch": "vitest --project unit",
  "test:cov": "vitest run --project unit --coverage",
  "test:debug": "vitest --project unit --inspect-brk --no-file-parallelism",
  "test:e2e": "vitest run --project e2e",
  "test:all": "vitest run"
  ```

## 2.2 Port the specs

- [ ] `jest.spyOn` → `vi.spyOn` (39 uses), `jest.SpyInstance` → `MockInstance` (1 use), and
      `jest.fn` / `jest.mock` → `vi.fn` / `vi.mock` (`vi.mock` is hoisted; check that factories do
      not use variables from outside their scope).
- [ ] `mockdate` → `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime(...)`. Remove
      `mockdate` once nothing imports it.
- [ ] Keep `globals: true`, so `describe` / `it` / `expect` need no imports. Add explicit
      `import { vi } from 'vitest'` where `vi` is used; it is clearer and survives a later
      `globals: false`.
- [ ] Supertest: `import request from 'supertest'` (default import) is already used. Keep it.
- [ ] **Triage the failing baseline specs** (phase 01) using AGENTS.md "Testing Strategy":
  - [ ] Specs left behind by intentional code changes: bring them up to the current contract
        (wisekeep found 8 of these). Do not weaken assertions just to make them pass.
  - [ ] Specs that only test framework wiring or trivial delegation (for example
        `mail-config.service.spec.ts`, the `*-repo` delegation specs, the CLI command wiring
        specs): delete them, and say so in the commit message.
  - [ ] Real bugs: fix them in code and keep or add the regression test.

## 2.3 E2E setup: cls-hooked transaction per test (port from wisekeep)

**Why.** `main.ts` binds Sequelize to a cls-hooked namespace (`Sequelize.useCLS`), so a query run
inside an active managed transaction joins it automatically. The current
`test/basic-e2e-setup.ts` never creates that namespace. The test parent transaction therefore
reaches only the code path that goes through `TransactionInterceptor`, via
`TestingTransactionInterceptor` → `setParentTransaction`. Guards, validators (`useContainer`),
repositories called outside the interceptor, and handlers without `TransactionInterceptor` run
**outside** the test transaction. They cannot see the test data and they leave rows behind.

Target flow:

```
managedTransaction(app, cb)
  └─ TransactionProviderService.createManaged  ── parent tx T0 (always rolled back)
       activeTestingTransaction = T0
       cb(T0) ── supertest request
                   └─ e2e middleware: namespace.run(() => ns.set('transaction', T0))
                        ├─ guards / pipes / validators / repositories → join T0 via CLS
                        └─ @UseInterceptors(TransactionInterceptor)
                             └─ TestingTransactionInterceptor set parent = T0
                             └─ createManaged → child tx T1 (savepoint of T0)
                                  └─ @ReqTransaction() → T1 (after-commit callbacks)
```

Tasks:

- [ ] **Shared namespace module** `src/helpers/sequelize-namespace/sequelize-namespace.ts`:

  ```ts
  import { createNamespace } from 'cls-hooked';
  export const SequelizeNamespaceName = 'sequelize-cls-hooks';
  export const sequelizeNamespace = createNamespace(SequelizeNamespaceName);
  ```

  `main.ts`, `cli.ts`, `tinker.ts` and the e2e setup all import it and call
  `Sequelize.useCLS(sequelizeNamespace)` once. No more inline `createNamespace` in `main.ts`.
- [ ] **pg type parsers** move out of `main.ts` into
      `src/helpers/pg-type-parsers/pg-type-parsers.ts` (`registerPgTypeParsers()`), called from
      `main.ts`, `cli.ts` and the e2e setup, so tests parse `INT8` the same way.
- [ ] `TransactionProviderService.getCurrentTransactionFromNamespace()`: port from wisekeep. It
      returns the active CLS transaction or `null`.
- [ ] **Rewrite `test/basic-e2e-setup.ts`** to mirror the current wisekeep file:
  - [ ] call `registerPgTypeParsers()` and `Sequelize.useCLS(sequelizeNamespace)` at module load;
  - [ ] add an Express middleware, registered before session and interceptors, that runs each
        request inside `sequelizeNamespace` with `transaction = activeTestingTransaction` when a
        `managedTransaction` scope is active. Call `bindEmitter(req)` / `bindEmitter(res)` so stream
        callbacks keep the context;
  - [ ] keep `TestingTransactionInterceptor` so route-level `TransactionInterceptor` opens a nested
        child transaction;
  - [ ] keep `managedTransaction` (forced rollback through `TestingTransactionRollbackError`);
  - [ ] add the `rootModule?: Type` option (a feature test can boot a smaller module);
  - [ ] mirror `main.ts` exactly: `enableVersioning({ type: URI, prefix: 'api/v' })` (missing
        today), the filters, the interceptors, the view engine, and the session/flash middleware;
  - [ ] remove the duplicated second `ErrorValidationFormatFilter` registration;
  - [ ] `checkValidationErrors` uses the global `expect` from Vitest.
- [ ] **`test/e2e-env.ts`** (Vitest `setupFiles`) sets env vars before any config loader runs:

  ```ts
  // Loaded before every e2e suite. dotenv never overrides variables that are already set.
  process.env.MAIL_DRIVER = 'memory';                    // phase 07: never deliver real mail
  process.env.MAIL_FROM_ADDRESS = 'noreply@example.com'; // @nestjs/mail validates the sender at boot
  ```

- [ ] **Storage and mail overrides** are added to `basicE2eSetup` in phases 07 / 08:
      `STORAGE_MODULE_OPTIONS` → `InMemoryDisk`s, and `MailTransport` → `InMemoryMailTransport`.
- [ ] **E2E coverage for the setup itself** (`test/transaction/transaction.e2e-spec.ts`):
  - [ ] a row created inside `managedTransaction` is visible to an API request (guard + repository
        path) made within the same callback;
  - [ ] after the callback, the row is gone (rollback);
  - [ ] a route with `TransactionInterceptor` that throws rolls back only its child transaction,
        and the parent's rows remain visible inside the callback;
  - [ ] an after-commit callback registered via `@ReqTransaction()` +
        `EventRegisterCallbackService` fires when the child commits.
- [ ] Port `test/app.e2e-spec.ts`. Add `afterAll(() => app.close())`; it is missing today and keeps
      handles open.
- [ ] Factories (`test/factories/user.factory.ts`) keep working through the CLS transaction, with no
      `transaction` argument threaded through.

## Check

- `npm test` and `npm run test:e2e` pass on Nest 11 / CJS. Unit results match the triaged baseline.
- The transaction e2e above passes, and the test DB holds no leftover rows after a full run.
- `grep -rn "jest" src test package.json` returns nothing.

## Outcome

_(fill in: oxc vs unplugin-swc decision, spec counts before/after, deleted specs and why)_
