# 03 — NestJS 12 core and ecosystem packages

**Status: not started**

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

- [ ] Run the commands above.
- [ ] If the old lockfile cannot resolve the v12 peer graph, regenerate it (wisekeep had to).
      Pin `prettier` exactly at the current version so a fresh lock does not reformat the repo.
- [ ] `overrides` for packages whose peers stop at 11:

  ```jsonc
  "overrides": {
    "nestjs-form-data": { "@nestjs/common": "$@nestjs/common", "@nestjs/core": "$@nestjs/core" },
    "nest-commander": { "@golevelup/nestjs-discovery": "^7.1.0" }
  }
  ```

## 3.2 Breaking changes that apply to this repo

### Core
- [ ] **Lifecycle hooks run in component-hierarchy order.** Smoke-test cluster boot and shutdown
      (`SetupClusterService`, `closeEvent`) and every `OnModuleDestroy` / `OnApplicationShutdown`
      user (`grep -rn "OnModule\|OnApplication" src`).
- [ ] **`@Optional()` is no longer inherited** by a subclass that redeclares its constructor.
      Re-declare it where needed. Wisekeep: `LoggingService` in the cluster primary has no
      `ClsModule`, so its `ClsService` must be `@Optional()` directly. **Only a real cluster boot
      caught this.**
- [ ] **`ArgumentMetadata` is generic.** Recompile the `map-*-to-param` pipes and fix the types.
- [ ] `bufferLogs: true` on `NestFactory.create` (app and cluster) and then `app.useLogger(...)`,
      so boot logs share one format (wisekeep).
- [ ] Optional, new in 12: `HttpExceptionOptions.errorCode`, `ValidationPipe` `errorFormat`, and
      route-conflict diagnostics (`routeConflictPolicy: { duplicate: 'error', shadow: 'warn' }`).
      Try `routeConflictPolicy` once to catch shadowed routes, then decide whether to keep it.

### Express 5 (already on Express 5 via Nest 11; check again under 12)
- [ ] `app.module.ts:78`: `forRoutes('*')` → `forRoutes('{*splat}')`.
- [ ] Query parser: decide between `simple` (the default) and `extended`. If any client sends
      `ids[]=1` / `ids[0]=1`, set `app.set('query parser', 'extended')` in `main.ts` **and** in the
      e2e setup, with a comment. Add an e2e test for the array query either way.
- [ ] `req.body` is `undefined` when there is no body. Check that `ContextInterceptor` defaults it to
      `{}` (it crashed every request in wisekeep).
- [ ] Wildcard params are `string[]`. Check the `path-param` template function.
- [ ] `route:list` reads `app.router` (wisekeep fixed this while porting to nest-commander).

### Swagger 12
- [ ] Swagger 12 appends the version to operation ids. Pass
      `operationIdFactory: (controllerKey, methodKey) => \`${controllerKey}_${methodKey}\`` in
      `setupApiDocumentation`.
- [ ] Diff `/api-documentation/v1-json` against `baseline-openapi.json`. Only intentional or
      docs-only diffs are allowed. Mapped types stay imported from `@nestjs/swagger`.

### Terminus 12
- [ ] `health.controller.ts`: import `HealthIndicatorFunction` from `@nestjs/terminus`, not from
      `@nestjs/terminus/dist/health-indicator`. Deep imports also break under ESM `exports` maps.
- [ ] No custom `HealthIndicator` subclasses exist, so the legacy API removal does not apply. If
      built-in checks pass a `timeout` option, switch to `.withTimeout(ms)`.
- [ ] Out of scope, note only: the `@OnEvent` handler in `HealthController` breaks the AGENTS.md
      "listeners only in listener classes" rule.

### Config 12
- [ ] Values from `load: [...]` factories take precedence over `process.env` in `ConfigService.get`.
      Grep `configService.get('[A-Z_]+'` and move each raw-env read into a config loader (the mail
      ones go in phase 07).
- [ ] No Joi / `validationSchema` is used, so the Standard Schema change does not apply.

### Third-party Nest modules
- [ ] **`nestjs-command` → `nest-commander`.**
  - [ ] Port every command in `src/cli-commands/commands/*`: `db:create` / `db:drop` (check the
        actual names), `migration:make|run|rollback|refresh`, the `oauth` commands, `route:list` and
        the seeder. Keep the names, positionals and options identical.
  - [ ] Each command becomes a thin `*.command.ts` (`@Command` + `CommandRunner`); the existing
        service keeps the logic. Folder-per-class, registered in `CliCommandsModule` `providers`.
  - [ ] `src/cli.ts` → `CommandFactory.run(AppModule, { logger })`. Commands that need routes
        (`route:list`) must boot an HTTP app; wisekeep added `HttpCommandFactory` for that.
  - [ ] Option types: numeric options get a parser (wisekeep: `migration:rollback --till 3` had been
        parsed as a string and always rolled back 1).
  - [ ] Replace `@UseCls()` in `generate-client.service.ts` if nest-commander changes how CLS is
        entered.
- [ ] **`nestjs-cls` 6 → 7.** Check the `ClsModule.forRoot` options and `CLS_REQ` usage in the
      template functions and `DatabaseConfigService`.
- [ ] **`nestjs-form-data`** with the override: run an upload e2e (added in phase 08) or a manual
      upload. If it fails, see the fallback in 08.
- [ ] **`nestjs-sequelize-paginate`**: confirm that `paginate-overwrite` still works (e2e on a
      paginated index).
- [ ] **`connect-flash` → in-house flash middleware** in
      `src/session-manager/middlewares/flash/flash.middleware.ts`, port from wisekeep. `connect-flash`
      is unmaintained and triggers Node 26 `DEP0044`. Keep the `req.flash(type, msg)` API.
- [ ] **Twig 1.17 → 3.0 (decided: always upgrade to latest).** The template only provides the Twig
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
