# 03 — NestJS 12 core and ecosystem packages

**Status: done** on branch `feature/upgrade-nestjs`. See "Outcome" at the end.

Docs: https://docs.nestjs.com/migration-guide (11 → 12).

Goal: every `@nestjs/*` package is on v12 and the app boots unchanged. The app is still CommonJS
here: Nest 12 packages are ESM-only and are loaded through Node's `require(esm)`. Mail and storage
keep their old implementations until phases 07 and 08.

## 3.1 Install

```bash
npm i -g @nestjs/cli@latest @nestjs/schematics@latest
npx nest upgrade --dry-run     # review the report first
npx nest upgrade               # bumps the recognised @nestjs/* packages together
```

`nest upgrade` also tries to bump Jest to 30. Jest is already gone after phase 02, so revert any Jest
re-add it makes. Bump the rest by hand:

```bash
npm i @nestjs/common@^12 @nestjs/core@^12 @nestjs/platform-express@^12 \
  @nestjs/config@^12 @nestjs/swagger@^12 @nestjs/terminus@^12 @nestjs/sequelize@^12 \
  @nestjs/event-emitter@^12 @nestjs/jwt@^12 @nestjs/passport@^12 \
  nestjs-cls@^7 nest-commander@^3.21 helmet@^8 reflect-metadata@^0.2 express-session@latest
npm i -D @nestjs/cli@^12 @nestjs/schematics@^12 @nestjs/testing@^12 @types/express@^5
npm rm nestjs-command yargs @types/yargs connect-flash @types/connect-flash
```

- [x] Run the commands above.
- [x] If the old lockfile cannot resolve the v12 peer graph, regenerate it (wisekeep had to).
      Pin `prettier` exactly at the current version so a fresh lock does not reformat the repo.
- [x] `overrides` for packages whose peers stop at 11:

  ```jsonc
  "overrides": {
    "nestjs-form-data": { "@nestjs/common": "$@nestjs/common", "@nestjs/core": "$@nestjs/core" },
    "nest-commander": { "@golevelup/nestjs-discovery": "^7.1.0" }
  }
  ```

## 3.2 Breaking changes that apply to this repo

### Core
- [x] **Lifecycle hooks run in component-hierarchy order.** Smoke-test cluster boot and shutdown
      (`SetupClusterService`, `closeEvent`) and every `OnModuleDestroy` / `OnApplicationShutdown`
      user (`grep -rn "OnModule\|OnApplication" src`).
- [x] **`@Optional()` is no longer inherited** by a subclass that redeclares its constructor.
      Re-declare it where needed. Wisekeep: `LoggingService` in the cluster primary has no
      `ClsModule`, so its `ClsService` must be `@Optional()` directly. **Only a real cluster boot
      caught this.**
- [x] **`ArgumentMetadata` is generic.** Recompile the `map-*-to-param` pipes and fix the types.
- [x] `bufferLogs: true` on `NestFactory.create` (app and cluster) and then `app.useLogger(...)`,
      so boot logs share one format (wisekeep).
- [x] Optional, new in 12: `HttpExceptionOptions.errorCode`, `ValidationPipe` `errorFormat`, and
      route-conflict diagnostics (`routeConflictPolicy: { duplicate: 'error', shadow: 'warn' }`).
      Try `routeConflictPolicy` once to catch shadowed routes, then decide whether to keep it.

### Express 5 (already on Express 5 via Nest 11; check again under 12)
- [x] `app.module.ts:78`: `forRoutes('*')` → `forRoutes('{*splat}')`.
- [x] Query parser: decide between `simple` (the default) and `extended`. If any client sends
      `ids[]=1` / `ids[0]=1`, set `app.set('query parser', 'extended')` in `main.ts` **and** in the
      e2e setup, with a comment. Add an e2e test for the array query either way.
- [x] `req.body` is `undefined` when there is no body. Check that `ContextInterceptor` defaults it to
      `{}` (it crashed every request in wisekeep).
- [x] Wildcard params are `string[]`. Check the `path-param` template function.
- [x] `route:list` reads `app.router` (wisekeep fixed this while porting to nest-commander).

### Swagger 12
- [x] Swagger 12 appends the version to operation ids. Pass
      `operationIdFactory: (controllerKey, methodKey) => \`${controllerKey}_${methodKey}\`` in
      `setupApiDocumentation`.
- [x] Diff `/api-documentation/v1-json` against `baseline-openapi.json`. Only intentional or
      docs-only diffs are allowed. Mapped types stay imported from `@nestjs/swagger`.

### Terminus 12
- [x] `health.controller.ts`: import `HealthIndicatorFunction` from `@nestjs/terminus`, not from
      `@nestjs/terminus/dist/health-indicator`. Deep imports also break under ESM `exports` maps.
- [x] No custom `HealthIndicator` subclasses exist, so the legacy API removal does not apply. If
      built-in checks pass a `timeout` option, switch to `.withTimeout(ms)`.
- [x] Out of scope, note only: the `@OnEvent` handler in `HealthController` breaks the AGENTS.md
      "listeners only in listener classes" rule.

### Config 12
- [x] Values from `load: [...]` factories take precedence over `process.env` in `ConfigService.get`.
      Grep `configService.get('[A-Z_]+'` and move each raw-env read into a config loader (the mail
      ones go in phase 07).
- [x] No Joi / `validationSchema` is used, so the Standard Schema change does not apply.

### Third-party Nest modules
- [x] **`nestjs-command` → `nest-commander`** (recipe: https://docs.nestjs.com/recipes/nest-commander#installation).
  - [x] Port every command in `src/cli-commands/commands/*`: `db:create` / `db:drop` (check the
        actual names), `migration:make|run|rollback|refresh`, the `oauth` commands, `route:list` and
        the seeder. Keep the names, positionals and options identical.
  - [x] Each command becomes a thin `*.command.ts` (`@Command` + `CommandRunner`); the existing
        service keeps the logic. Folder-per-class, registered in `CliCommandsModule` `providers`.
  - [x] `src/cli.ts` → `CommandFactory.run(AppModule, { logger })`. Commands that need routes
        (`route:list`) must boot an HTTP app; wisekeep added `HttpCommandFactory` for that.
  - [x] Option types: numeric options get a parser (wisekeep: `migration:rollback --till 3` had been
        parsed as a string and always rolled back 1).
  - [x] Replace `@UseCls()` in `generate-client.service.ts` if nest-commander changes how CLS is
        entered.
- [x] **`nestjs-cls` 6 → 7.** Check the `ClsModule.forRoot` options and `CLS_REQ` usage in the
      template functions and `DatabaseConfigService`.
- [x] **`nestjs-form-data`** with the override: run an upload e2e (added in phase 08) or a manual
      upload. If it fails, see the fallback in 08.
- [x] **`nestjs-sequelize-paginate`**: confirm that `paginate-overwrite` still works (e2e on a
      paginated index).
- [x] **`connect-flash` → in-house flash middleware** in
      `src/session-manager/middlewares/flash/flash.middleware.ts`, port from wisekeep. `connect-flash`
      is unmaintained and triggers Node 26 `DEP0044`. Keep the `req.flash(type, msg)` API.
- [x] **Twig 1.17 → 3.0 (decided: always upgrade to latest).** The template only provides the Twig
      entry point (view engine, template functions, sample views); projects build on it. Fix the
      view engine and template functions for any API change in Twig 3 and make the sample views
      render; do not pin 1.x.

## Check

- `npm run build`, `npm test` and `npm run test:e2e` pass.
- `node dist/main.js` boots the **cluster** (primary + worker); `GET /health` returns 200.
- `route:list` matches the baseline (apart from the wildcard pattern).
- The OpenAPI diff has no unintended contract changes.
- The web login → session/flash → redirect-to-login flow works in a browser.
- `grep -rn "nestjs-command\|connect-flash\|@nestjs/.*/dist/" src test` returns nothing.

## Outcome (2026-11-24)

Installed: `@nestjs/common` / `core` / `platform-express` / `testing` 12.6.0, `config` 12.1.1,
`swagger` 12.1.2, `terminus` 12.2.0, `sequelize` 12.0.1, `event-emitter` 12.0.3, `jwt` 12.0.5,
`passport` 12.0.2, `cli` 12.0.15, `schematics` 12.0.16, `nestjs-cls` 7.0.2, `nest-commander` 3.21.0,
`twig` 3.0.0, `nestjs-form-data` 11.0.1 (override). Removed: `nestjs-command`, `yargs`,
`@types/yargs`, `connect-flash`, `@types/connect-flash`.

| Check | Result |
| ----- | ------ |
| `tsc -p tsconfig.build.json` / `npm run build` / `npm run lint` | ✅ / ✅ / ✅ (0 errors, 6 warnings) |
| Unit + e2e | ✅ 79 files, 270 tests |
| Boot `dist/main.js` | ✅ `/health` 200 (now includes `responseTime`, additive), `/` renders (Twig 3), SIGTERM exits cleanly |
| `route:list` | ✅ identical to `baseline-routes.txt` (9 routes) |
| OpenAPI | operation ids unchanged; only diff is `allowEmptyValue: false` on the two `accept` headers (docs only) |
| `DEP0044` at boot | ✅ gone (connect-flash removed) |

How this differs from the plan:

- **`nest upgrade` does not exist in the published CLI (12.0.15)**, although the migration guide
  documents it. Packages were bumped by hand. `@swc/cli` had to go to `^0.8` (peer of CLI 12).
- **Deep imports** (blocked by the Nest 12 `exports` maps) replaced with root exports:
  `HealthIndicatorFunction` (terminus), `SchemaObject` (swagger). `ModelBootstrapModule` used
  `DEFAULT_CONNECTION_NAME` and `EntitiesMetadataStorage` from `@nestjs/sequelize/dist`: the
  token helpers default to the default connection, and the metadata storage is only read with
  `autoLoadModels` (not used), so both were dropped.
- **nest-commander.** Each command is a thin `*.command.ts` (`CommandRunner`) next to its existing
  service, which keeps the logic and its spec. Command names and arguments are unchanged
  (`npm run app:command -- --help` lists all 10).
  - `HttpCommandFactory` (`src/cli-commands/http-command-factory/`) extends `CommandFactory` and
    boots nest-commander's command module with `NestFactory.create` (+ `init`, no listen), so
    `route:list` still sees the router.
  - nest-commander's default `serviceErrorHandler` prints the error and **exits 0**. `cli.ts` sets
    `process.exitCode = 1` so failing commands fail scripts/CI.
  - **Bug fixed:** `migration:rollback --till 3` arrived as a string, so it always rolled back 1.
    `--till` is now parsed and validated as a positive integer.
  - `oauth:generate-client` validates the grant type with a clear message.
  - `seeder:seed` service signature simplified to `seed({ all })`.
  - The temporary Vitest alias for `nestjs-command` is removed.
  - Note: running `dist/cli.js` directly does **not** find migrations yet (the glob is `*.ts`,
    `dist` has `.js`). `app:command` still runs from source via ts-node, which works. Phase 04
    adds the shared migration-file helper that fixes this.
- **`@Optional()` no longer inherited.** `LoggingService` (extends `ConsoleLogger`) silently got
  `ConsoleLogger`'s `@Optional()` markers under Nest 11, so a missing `ClsService` (cluster
  primary has no `ClsModule`) resolved to `undefined`. It now declares `@Optional()` on
  `clsService` itself. Its spec now provides `ConfigService` and covers both the CLS and no-CLS
  message formats.
- **Express 5 body:** `ContextInterceptor` crashed (500) on any non-GET request without a body
  (`req.body` is `undefined`). It now defaults the body to `{}`. Regression:
  `test/http/request-body.e2e-spec.ts` (failed with 500 before).
- **Query parser:** kept Express 5's default `simple`. The template has no array query
  parameters; projects that need `ids[]=1` style must set `query parser` to `extended` in `main.ts`
  and the e2e setup.
- **Config:** `HashEncryptService` now reads `system.secret` / `system.encryptHexKey` from the
  config loader instead of raw `APP_SECRET` / `APP_ENCRYPT_HEX_KEY` keys (documented in
  `.env.example`). The raw `MAIL_*` reads go away in phase 07.
- **Flash:** in-house `flashMiddleware` (ported from wisekeep, same `req.flash()` contract) with a
  unit spec; `main.ts` and the e2e setup use it.
- **Twig 3:** the only breaking change in 2.x/3.x is the Node minimum (≥ 22). Views render
  unchanged. `@types/twig` (1.x typings) still matches the API the view engine uses.
- `main.ts`: `bufferLogs` + `useLogger` for both the app and the cluster primary; Swagger
  `operationIdFactory` keeps `Controller_method` ids; `forRoutes('{*splat}')`.
- AGENTS.md "Adding CLI commands" was updated now (nest-commander), not in phase 09, so the
  branch never documents a removed API.

**Found, not fixed (pre-existing):** a browser `GET /oauth/authorization` with invalid/missing
parameters and no `Referer` redirects to itself until the browser gives up.
`SessionMapPreviousUrlInterceptor` stores the current URL as "previous" before validation, and
`ErrorValidationFormatFilter` redirects back to it. Wisekeep fixed the same code by rendering an
error page for failed web GETs. Listed in README.md "Known issues".
