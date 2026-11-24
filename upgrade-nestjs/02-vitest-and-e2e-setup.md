# 02 — Jest → Vitest, and an e2e setup with cls-hooked transactions

**Status: done** on branch `feature/upgrade-nestjs`. See "Outcome" at the end.

Docs: https://docs.nestjs.com/fundamentals/testing. Nest 12 ESM starters use Vitest, and
`@nestjs/testing` works with any runner.

Goal: replace Jest with Vitest for unit and e2e tests while still on Nest 11 / CJS. Rebuild
`test/basic-e2e-setup.ts` so that **every query during a test, including those made by guards,
validators, repositories and listeners, joins one rolled-back transaction**, the way wisekeep does.

## 2.1 Install and config

- [x] `npm i -D vitest@^5 @vitest/coverage-v8@^5`
- [x] `npm rm jest @types/jest @swc/jest ts-jest`, and drop the `jest` block from `package.json`.
- [x] **Decorator metadata spike.** Nest DI and Swagger need `emitDecoratorMetadata`, and plain
      esbuild cannot emit it.
  - [x] Try Vite's built-in oxc transform first, with legacy decorators and `emitDecoratorMetadata`
        turned on.
  - [x] If DI fails (`Nest can't resolve dependencies of X (?)`), use `unplugin-swc`:
        `npm i -D unplugin-swc @swc/core` and `swc.vite({ module: { type: 'es6' } })` with the
        legacy-decorator and decorator-metadata options inline (`swcrc: false`). Then delete
        `.swcrc`.
  - [x] Record which one was chosen and why at the end of this file.
- [x] `vitest.config.mts` (the config file is ESM even while the app is CJS):

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

- [x] Delete `test/jest-e2e.json`.
- [x] tsconfig: `"types": ["node", "vitest/globals"]`.
- [x] Scripts:

  ```jsonc
  "test": "vitest run --project unit",
  "test:watch": "vitest --project unit",
  "test:cov": "vitest run --project unit --coverage",
  "test:debug": "vitest --project unit --inspect-brk --no-file-parallelism",
  "test:e2e": "vitest run --project e2e",
  "test:all": "vitest run"
  ```

## 2.2 Port the specs

- [x] `jest.spyOn` → `vi.spyOn` (39 uses), `jest.SpyInstance` → `MockInstance` (1 use), and
      `jest.fn` / `jest.mock` → `vi.fn` / `vi.mock` (`vi.mock` is hoisted; check that factories do
      not use variables from outside their scope).
- [x] `mockdate` → `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime(...)`. Remove
      `mockdate` once nothing imports it.
- [x] Keep `globals: true`, so `describe` / `it` / `expect` need no imports. Add explicit
      `import { vi } from 'vitest'` where `vi` is used; it is clearer and survives a later
      `globals: false`.
- [x] Supertest: `import request from 'supertest'` (default import) is already used. Keep it.
- [x] **Triage the failing baseline specs** (phase 01) using AGENTS.md "Testing Strategy":
  - [x] Specs left behind by intentional code changes: bring them up to the current contract
        (wisekeep found 8 of these). Do not weaken assertions just to make them pass.
  - [x] Specs that only test framework wiring or trivial delegation (for example
        `mail-config.service.spec.ts`, the `*-repo` delegation specs, the CLI command wiring
        specs): delete them, and say so in the commit message.
  - [x] Real bugs: fix them in code and keep or add the regression test.

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

- [x] **Shared namespace module** `src/helpers/sequelize-namespace/sequelize-namespace.ts`:

  ```ts
  import { createNamespace } from 'cls-hooked';
  export const SequelizeNamespaceName = 'sequelize-cls-hooks';
  export const sequelizeNamespace = createNamespace(SequelizeNamespaceName);
  ```

  `main.ts`, `cli.ts`, `tinker.ts` and the e2e setup all import it and call
  `Sequelize.useCLS(sequelizeNamespace)` once. No more inline `createNamespace` in `main.ts`.
- [x] **pg type parsers** move out of `main.ts` into
      `src/helpers/pg-type-parsers/pg-type-parsers.ts` (`registerPgTypeParsers()`), called from
      `main.ts`, `cli.ts` and the e2e setup, so tests parse `INT8` the same way.
- [x] `TransactionProviderService.getCurrentTransactionFromNamespace()`: port from wisekeep. It
      returns the active CLS transaction or `null`.
- [x] **Rewrite `test/basic-e2e-setup.ts`** to mirror the current wisekeep file:
  - [x] call `registerPgTypeParsers()` and `Sequelize.useCLS(sequelizeNamespace)` at module load;
  - [x] add an Express middleware, registered before session and interceptors, that runs each
        request inside `sequelizeNamespace` with `transaction = activeTestingTransaction` when a
        `managedTransaction` scope is active. Call `bindEmitter(req)` / `bindEmitter(res)` so stream
        callbacks keep the context;
  - [x] keep `TestingTransactionInterceptor` so route-level `TransactionInterceptor` opens a nested
        child transaction;
  - [x] keep `managedTransaction` (forced rollback through `TestingTransactionRollbackError`);
  - [x] add the `rootModule?: Type` option (a feature test can boot a smaller module);
  - [x] mirror `main.ts` exactly: `enableVersioning({ type: URI, prefix: 'api/v' })` (missing
        today), the filters, the interceptors, the view engine, and the session/flash middleware;
  - [x] remove the duplicated second `ErrorValidationFormatFilter` registration;
  - [x] `checkValidationErrors` uses the global `expect` from Vitest.
- [x] **`test/e2e-env.ts`** (Vitest `setupFiles`) sets env vars before any config loader runs:

  ```ts
  // Loaded before every e2e suite. dotenv never overrides variables that are already set.
  process.env.MAIL_DRIVER = 'memory';                    // phase 07: never deliver real mail
  process.env.MAIL_FROM_ADDRESS = 'noreply@example.com'; // @nestjs/mail validates the sender at boot
  ```

- [x] **Storage and mail overrides** are added to `basicE2eSetup` in phases 07 / 08:
      `STORAGE_MODULE_OPTIONS` → `InMemoryDisk`s, and `MailTransport` → `InMemoryMailTransport`.
- [x] **E2E coverage for the setup itself** (`test/transaction/transaction.e2e-spec.ts`):
  - [x] a row created inside `managedTransaction` is visible to an API request (guard + repository
        path) made within the same callback;
  - [x] after the callback, the row is gone (rollback);
  - [x] a route with `TransactionInterceptor` that throws rolls back only its child transaction,
        and the parent's rows remain visible inside the callback;
  - [x] an after-commit callback registered via `@ReqTransaction()` +
        `EventRegisterCallbackService` fires when the child commits.
- [x] Port `test/app.e2e-spec.ts`. Add `afterAll(() => app.close())`; it is missing today and keeps
      handles open.
- [x] Factories (`test/factories/user.factory.ts`) keep working through the CLS transaction, with no
      `transaction` argument threaded through.

## Check

- `npm test` and `npm run test:e2e` pass on Nest 11 / CJS. Unit results match the triaged baseline.
- The transaction e2e above passes, and the test DB holds no leftover rows after a full run.
- `grep -rn "jest" src test package.json` returns nothing.

## Outcome

## Outcome (2026-11-24)

| Check | Result |
| ----- | ------ |
| Unit (`npm test`) | ✅ **74/74 suites, 246 tests** (baseline: 8 suites / 25 tests failing, and 0 runnable under the repo's own Jest config) |
| E2E (`npm run test:e2e`) | ✅ 2 files, 4 tests (new `test/transaction/transaction.e2e-spec.ts`) |
| `npm run build` / `npm run lint` | ✅ / ✅ (7 warnings, same as baseline) |
| Boot `dist/main.js` (cluster) | ✅ `/health` 200 |
| `npx tsc -p tsconfig.json --noEmit` | 155 errors, all inside spec mocks (implicit `any`, `null` where the type forbids it). They do not affect test runs and are fixed in phase 10 |

**Transform: oxc, not SWC.** Vite 8 transforms TS with oxc, and
`oxc: { decorator: { legacy: true, emitDecoratorMetadata: true } }` emits `design:paramtypes`.
A DI probe proved it. `unplugin-swc` was not needed. `@swc/core` and `.swcrc` stay only for
`nest build` until phase 05.

**Spec port.** `jest.*` → `vi.*`, `jest.SpyInstance` → `MockInstance`, `mockdate` →
`vi.setSystemTime` (with `vi.useRealTimers()` in `afterEach`; mockdate was never reset before).
Jest/Vitest differences that broke tests:

- `mockImplementation()` with no argument stubs in Jest but **keeps the original** in Vitest →
  `mockImplementation(() => undefined)` (6 specs).
- Jest's `done` callback does not exist in Vitest → plain sync tests.
- Spying on **named ESM imports of Node built-ins** (`randomBytes` from `crypto`, `cwd` from
  `node:process`) only worked because Jest mutated CommonJS module objects. It cannot work under
  ESM, so those two specs now assert real behaviour (byte length, real `cwd`) instead of mocking.
- `process.send` exists only in an IPC child process. The spec now provides one for its test.
- **Pool: `threads`, not `forks`.** Under `forks`, `ProcessMessagingService` (cluster IPC) logged
  every Vitest IPC message. cls-hooked works per thread.
- `nestjs-command`'s exports map has only a `require` condition, which Vite's resolver refuses.
  A temporary `resolve.alias` in `vitest.config.mts` points at its `dist/index.js`; phase 03
  removes the package and the alias.

**The 8 baseline failures, triaged** (no spec was deleted):

| Suite | Cause | Fix |
| ----- | ----- | ----- |
| `OauthController`, `HashEncryptService`, `DatabaseConfigService`, `MailService`, `UrlBuilderService` | Code moved from `configService.get` to `getOrThrow`; mocks and spies did not | Specs updated to the current contract |
| `ClientIdExistsValidator` | Validator moved to class-validator's `validate()` / `defaultMessage()`; spec still called `check()` / `message()` | Spec updated. It is permission logic, so it stays a unit test |
| `RefreshTokenService` | Test DTO had no decorators, so class-validator 0.14 (`forbidUnknownValues`) rejected it | Test DTO gets a real `@IsNotEmpty()` field |
| `MethodChangeMiddleware` | **Real bug:** a non-string `_method` (number, `_method[]=x`, object) or a `null` body threw `toLowerCase is not a function`, giving a 500 on every route (the middleware runs on `*`) | Code fixed; regression cases added |

**Other bug fixed:** `ClientRepoService.revoke()` set `is_revoked: false`, so revoking did
nothing. Its spec asserted the buggy value; both were corrected (no callers yet).

**E2E transaction setup.**

- `src/helpers/sequelize-namespace/` (`sequelizeNamespace`, `registerSequelizeCls()`) and
  `src/helpers/pg-type-parsers/` are shared by `main.ts`, `cli.ts`, `tinker.ts` and the e2e setup.
  **The CLI and REPL now bind Sequelize to CLS too**; before, only `main.ts` did.
- `basicE2eSetup` mirrors `main.ts`: it adds `enableVersioning`, `KillForApiInterceptor` and
  `useLogger`, and removes the duplicate filter. It adds the per-request CLS middleware and a
  `rootModule` option.
- **`basicE2eSetup` now calls `app.listen(0)`.** Without it, supertest starts the server lazily on
  the first request. The server then inherits the CLS context of the test that happened to send
  it, so transaction scoping worked **by accident**: the new e2e test passed even with the
  middleware removed. With the server listening from setup, removing the middleware makes the
  password-grant test fail with 422, which proves the mechanism.
- Factories rely on CLS (no `transaction` argument needed). `userFactory` hashes a plain
  `password`. New `clientFactory`.
- `test/transaction/transaction-probe.module.ts` is a test-only controller using
  `TransactionInterceptor` + `@ReqTransaction()` + `EventRegisterCallbackService`. It covers child
  commit, child rollback, and after-commit callbacks.

**Found, not fixed (needs a decision): the password grant ignores revoked clients.**
`POST /oauth/token` (`ImplicitPasswordGrantType`) looks the client up with
`ClientRepoService.findForIdAndSecret()`, which matches only `id` + `secret`. `@ClientIdExists()`
(which checks `is_revoked` and `grant_type`) is applied only to `authorization.dto.ts`, not to
`AccessTokenDto`. So a revoked client, or one registered for another grant type, still gets
password tokens. See README.md "Known issues".

**Also noted:** `EventRegisterCallbackService.registerEventCallBacks` without a transaction does
**not** run the callback immediately, as AGENTS.md says; it returns an executioner the caller must
invoke. Wisekeep changed it to fire immediately. Decide in phase 09 when AGENTS.md is updated.
