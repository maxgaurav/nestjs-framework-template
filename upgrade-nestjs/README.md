# Upgrade plan: NestJS 11 → 12, ESM, Vitest, TypeScript 7, oxlint, `@nestjs/mail`, `@nestjs/storage`

Status: **in progress** on branch `feature/upgrade-nestjs`: phases 01–08 done, 10 next. Plan written 2026-11-24 against `master` @ `f62f6cf`.

Reference implementation: `wisekeep-backend/upgrade-nestjs/` (same template lineage, upgraded
10 → 12 on 2026-11-20…23). Its findings are reused here. This plan goes further than wisekeep in two
places: it moves the app to **native ESM**, and it replaces **Jest with Vitest**.

Docs:
[migration guide](https://docs.nestjs.com/migration-guide) ·
[testing](https://docs.nestjs.com/fundamentals/testing) ·
[file storage](https://docs.nestjs.com/application/file-storage) ·
[mail](https://docs.nestjs.com/application/mail)

## Current state (inventory)

| Area         | Today                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------- |
| Node         | `.nvmrc` = `v24` (local 24.22.1). CI: `24.x`                                                       |
| Nest         | `@nestjs/*` 11.1.x, `@nestjs/cli` 11.0.14. Express 5 already in use                                 |
| Module format | CommonJS output (no `"type"` in `package.json`), `module: nodenext`                               |
| TypeScript   | 6.0.3, `strict: true`, `declaration` + `declarationDir` on (not needed for an app)                 |
| Build / run  | `nest build` (SWC + `typeCheck`). `app:command` = `ts-node --swc`. `tinker` = `nest start --entryFile tinker` |
| Tests        | Jest 29 + `@swc/jest`. 74 `*.spec.ts`, 1 e2e spec. **Tests are disabled in CI** ("need to re-introduce test after fixing") |
| E2E setup    | `test/basic-e2e-setup.ts` has `managedTransaction` + `TestingTransactionInterceptor`, but **no cls-hooked namespace**. Queries made outside the request's managed transaction do not join the test transaction |
| Lint         | ESLint 9 flat config (`eslint.config.mjs`), `typescript-eslint` recommendedTypeChecked + prettier plugin |
| Mail         | `@nestjs-modules/mailer` 1.11 + `nodemailer` 7. `MailService` renders Twig itself. Config points at a stale `dist/view-engine/views/emails` path |
| File storage | `nestjs-form-data` (`FileSystemStoredFile` → `storage/uploads/tmp`). Unused `filesystemConfig` stub |
| CLI          | `nestjs-command` (peer ≤ 11, unmaintained) + `yargs`                                               |
| Health       | Built-in terminus indicators only. A deep import of `@nestjs/terminus/dist/health-indicator`       |
| CLS          | `cls-hooked` namespace for Sequelize (`main.ts`); `nestjs-cls` 6 (wrongly listed in devDependencies) |

## Target versions (checked on npm 2026-11-24)

| Package                                                     | Target                                                    |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| `@nestjs/common` / `core` / `platform-express` / `testing`  | `^12` (latest 12.6.0)                                      |
| `@nestjs/config` / `swagger` / `terminus` / `sequelize` / `event-emitter` / `jwt` / `passport` | `^12`                   |
| `@nestjs/cli` / `@nestjs/schematics`                        | `^12` (12.0.15). Schematics need TypeScript `^6` as a peer |
| `@nestjs/mail`                                              | `0.0.2`. **Pre-1.0, pin exactly**                          |
| `@nestjs/storage`                                           | `0.0.5`. **Pre-1.0, pin exactly**. Peer is `^12.1.0`       |
| Node.js                                                     | **26 LTS** (`.nvmrc` `v26`, `engines.node` `>=26`)         |
| `typescript`                                                | `^6`, the compiler API for the Nest CLI/schematics and the IDE |
| `typescript-native`                                         | `npm:typescript@^7.0.2`, the Go compiler used by the build scripts |
| `vitest`                                                    | `^5.1` (+ `@vitest/coverage-v8`)                           |
| `unplugin-swc`                                              | **Not needed**: Vite 8's oxc transform emits decorator metadata (phase 02) |
| `oxlint` + `oxlint-tsgolint`                                | `^1.95` / `^7.0.2008`                                      |
| `nest-commander`                                            | `^3.21` (replaces `nestjs-command`)                        |
| `nestjs-cls`                                                | `^7`, moved to `dependencies`                              |
| `nestjs-form-data`                                          | latest (11.0.1), with npm `overrides` until it accepts Nest 12 |
| `bcrypt` / `helmet` / `supertest` / `@faker-js/faker`       | `^6` / `^8.3` / `^7.3` / `^10.6`                           |
| `twig`                                                      | **`^3.0.0`** (forced upgrade; the template only provides the Twig entry point) |
| `class-validator`                                           | Stay on `0.14.x` while `nestjs-form-data` peers on `^0.14` (0.15.1 is out) |

## Phases

Each phase leaves the app building, booting and passing tests, so each one can be its own commit.

| #  | Phase                                                                    | Depends on | Status |
| -- | ------------------------------------------------------------------------ | ---------- | ------ |
| 01 | [Baseline, Node 26, tsconfig cleanup](./01-baseline-and-toolchain.md)    | –          | ✅ done |
| 02 | [Jest → Vitest, e2e setup with cls-hooked transactions](./02-vitest-and-e2e-setup.md) | 01 | ✅ done |
| 03 | [NestJS 12 core + ecosystem packages](./03-nestjs-12-core.md)            | 02         | ✅ done |
| 04 | [CommonJS → native ESM](./04-esm-migration.md)                           | 03         | ✅ done |
| 05 | [TypeScript 7 build and direct run (gated)](./05-typescript-7-build-and-run.md) | 04  | ✅ done (GO) |
| 06 | [ESLint → oxlint](./06-oxlint.md)                                        | 01 (05 for type-aware rules) | ✅ done |
| 07 | [Mail → `@nestjs/mail`](./07-mail.md)                                    | 03         | ✅ done |
| 08 | [File storage → `@nestjs/storage`](./08-file-storage.md)                 | 03         | ✅ done |
| 10 | [Full strict TypeScript](./10-strict-typescript.md)                      | 05 (runs before 09) | ⬜ not started |
| 09 | [CI, AGENTS.md, final verification](./09-ci-and-verification.md)         | all        | ⬜ not started |

**Why Vitest comes before Nest 12.** Nest 12 packages are ESM-only. Jest loads them only on Node
24.9+, and only with `--experimental-vm-modules` (wisekeep needed this). Moving to Vitest first
keeps a working test suite through the Nest 12 and ESM phases, and avoids an interim Jest 30 step
that we would throw away.

Phases 06, 07 and 08 are independent of each other once 03 is merged. Phase 10 runs after 05
and before 09, so CI enforces the strict flags.

## Decisions

1. **Node 26 LTS.** It meets every minimum: Nest 12 needs ≥ 20.19, the Nest 12 CLI needs 22.22.3+,
   24.15+ or 26+, and native modules (`bcrypt` 6, `pg`) have prebuilds. Wisekeep already runs on it.
2. **Native ESM app** (`"type": "module"`). Relative imports get `.js` extensions,
   `import.meta.dirname` replaces `__dirname`, migrations load through `import()`, and Vitest runs
   natively. This matches the Nest 12 ESM starter. It is the largest phase (04).
3. **Vitest replaces Jest** for unit and e2e tests. `@nestjs/testing` does not depend on a runner.
4. **TypeScript 7 (tsgo) builds and type-checks.** TS 6 stays installed for the tools that need the
   classic compiler API: Nest schematics (`nest g`), the IDE, and `unplugin-swc` typings. Wisekeep
   showed a full emit taking about 1 s against 8.5 s for `nest build`. `ts-node` and `@swc/cli` go.
   This is a **gated** phase with a fallback (see 05).
5. **oxlint replaces ESLint.** Prettier stays for formatting, as `format` / `format:check`.
6. **`nestjs-command` → `nest-commander`.** The old package stops at Nest 11. Command names and
   options stay the same, so `npm run app:command -- <command>` and AGENTS.md still hold.
7. **`@nestjs/mail` behind our own `MailService` and Mailable classes**, with Twig kept through a
   custom `MailTemplateEngine`. No outbox.
8. **`@nestjs/storage` for blob storage, while keeping `nestjs-form-data` for multipart input.**
   DTO-level file validation (`@IsFile`, `@MaxFileSize`, `@HasMimeType`) stays in the DTO, as the
   AGENTS.md DTO rules want. Validated temp files are then streamed onto a storage disk by a service.
   See 08 for the trade-offs.
9. **E2E tests use one rolled-back transaction per test, and every query joins it via cls-hooked.**
   This is the wisekeep setup. Routes still use `@UseInterceptors(TransactionInterceptor)` /
   `@ReqTransaction()`. See 02.
10. **No legacy shims.** This is a template, so things are replaced outright.
11. **Full strict TypeScript** (phase 10): drop `strictPropertyInitialization: false` and add
    `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
    `noPropertyAccessFromIndexSignature` and the unused/returns checks. About 140 errors in `src`
    (measured), mostly mechanical: `declare` on model columns, `!` on DTO fields.

## Main risks

| Risk | Mitigation |
| ---- | ---------- |
| **ESM + decorator metadata + circular imports.** In ESM, `__metadata("design:type", UserModel)` on a circular model import throws a TDZ `ReferenceError` at load time, where CJS silently gave `undefined`. Sequelize models (`@BelongsTo(() => X)` with `x: X`) and Nest providers that use `forwardRef` are the hot spots | Phase 04: type relation properties with a `Relation<T>` / `WrapperType<T>` alias so the metadata becomes `Object`, and keep `() => X` thunks. Boot gate plus e2e |
| `sequelize-typescript` `models: [glob]` loads files with `require` | Phase 04: use the explicit `DefaultConnectionModels` list instead of the glob |
| `cls-hooked` uses `async_hooks`, which is legacy; Vitest runs in workers | Phase 02 checks the namespace inside Vitest (`pool: 'forks'`). Moving to an `AsyncLocalStorage` shim is a noted follow-up, not in scope |
| `@nestjs/mail` 0.0.2 / `@nestjs/storage` 0.0.5 are pre-1.0 | Pin exactly. Hide them behind our services. Use `InMemoryMailTransport` / `InMemoryDisk` in e2e |
| `nestjs-form-data` peer stops at Nest 11 and class-validator 0.14 | npm `overrides` plus an upload e2e test (wisekeep: works). Fallback in 08 |
| `@nestjs/mail` validates `from` at boot. `noreply@nesttemplate` has no TLD and **stops the app from booting** | Default and `.env.example` become `noreply@example.com` (phase 07) |
| Lifecycle hooks now run in component-hierarchy order | Smoke-test cluster start/stop (phase 03) |
| `@Optional()` is no longer inherited (wisekeep: `LoggingService` in the cluster primary, caught only by a real boot) | Boot `dist/main.js` in cluster mode in phase 03, not only e2e |
| Existing unit specs may already be failing (CI has them disabled) | Phase 01 records the baseline. Phase 02 fixes or deletes them, following the AGENTS.md test rules |

## Known issues found during the upgrade

| Issue | Status |
| ----- | ------ |
| `MethodChangeMiddleware` crashed (500) on a non-string `_method` | ✅ fixed in phase 02 |
| `ClientRepoService.revoke()` set `is_revoked: false` | ✅ fixed in phase 02 |
| Password grant (`POST /oauth/token`) did not check `is_revoked` / `grant_type`; refresh and code/PKCE exchanges accepted revoked clients | ✅ fixed after phase 02 (`test/auth/oauth-token.e2e-spec.ts`) |
| `registerEventCallBacks` without a transaction does not fire immediately (AGENTS.md says it does) | open; decide in phase 09 |
| `tsconfig.json` includes only `src`, so `test/` is never type-checked | phase 10 |
| `migration:rollback --till N` always rolled back 1 (string option) | ✅ fixed in phase 03 |
| `ContextInterceptor` returned 500 for any body-less non-GET request (Express 5) | ✅ fixed in phase 03 |
| `GET /oauth/authorization` with invalid params and no `Referer` redirects to itself (loop) | planned in phase 09 (port wisekeep's fix) |
| Sessions run on every API request; `KillForApiInterceptor` destroys them afterwards (logs web users out when they call the API, substring URL match) | planned in phase 09 (stateless API routes, `@UseSession()` opt-in) |
| `dist/cli.js` does not find migrations (`*.ts` glob) | ✅ fixed in phase 04 (`MigratorFactoryService`) |
| migration run/rollback used different module shapes (`default.up` vs `down`) | ✅ fixed in phase 04 |
| Swagger operation ids duplicated as `OauthController_` (`LoggingDecorator` dropped the method name) | ✅ fixed in phase 04 |

## Follow-ups (out of scope)

- Logging upgrade (structured params, JSON format, redaction). Wisekeep phase 04 is the reference.
- Replace `cls-hooked` with an `AsyncLocalStorage`-backed namespace for `Sequelize.useCLS`.
- `@nestjs/observe`, Standard Schema validation, `routeConflictPolicy`.
- Delete `upgrade-nestjs/` after the merge.
