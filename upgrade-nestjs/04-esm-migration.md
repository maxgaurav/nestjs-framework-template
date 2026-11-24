# 04 — CommonJS → native ESM

**Status: done** on branch `feature/upgrade-nestjs`. See "Outcome" at the end.

Docs: https://docs.nestjs.com/migration-guide (ESM section). `nest new` now offers an ESM starter
with Vitest and oxlint, and this phase brings the template in line with it.

Goal: `"type": "module"` in `package.json`, so the emitted `dist/*.js` is ESM. The app, CLI, tinker,
migrations and tests all run natively as ESM, and nothing relies on `require(esm)` any more.

## 4.1 Switch

- [x] `package.json`: `"type": "module"`.
- [x] tsconfig already has `module` / `moduleResolution: nodenext` and `isolatedModules`. Keep
      `esModuleInterop`. With `"type": "module"`, `nodenext` now emits ESM.
- [x] Root config files that must stay CommonJS get a `.cjs` extension (check `.prettierrc`, and any
      `*.config.js`). Tool configs that are ESM use `.mjs` / `.mts` (`vitest.config.mts`).
- [x] `nest-cli.json` and `tsconfig.build.json` do not change because of ESM.

## 4.2 Source changes

- [x] **Relative import extensions.** Every relative import and export gets `.js`
      (`./app.module.js` for `app.module.ts`). Do it in one mechanical pass: run
      `tsc --noEmit`, fix every TS2835 / TS2834 error with a codemod, and review the diff. Directory
      imports (`./foo` → `./foo/index.js`) need extra care.
- [x] **`__dirname` / `__filename`** → `import.meta.dirname` / `import.meta.filename`:
  - [x] `src/environment/configs/databases.ts` (`models`, `migrationDirectory`, `seedingDirectory`);
  - [x] `grep -rn "__dirname\|__filename\|require(\|require\.\|module\.exports\|exports\." src test`.
- [x] **`import x = require(...)`**: only `mail-config.service.ts` uses it, and phase 07 deletes
      that file. If phase 07 has not landed yet, change it to a type-only import.
- [x] **Default vs namespace imports of CJS packages.** Check `import * as Twig from 'twig'`,
      `import * as process from 'process'`, `helmet`, `cls-hooked`, `express-session`,
      `session-file-store` and `bcrypt`. Under ESM, a CJS package's `module.exports` is the
      **default** export, and named exports work only where Node's cjs-module-lexer detects them.
      Fix each import that fails at runtime and keep the change minimal.
- [x] **JSON imports** need `with { type: 'json' }`, or read the file with `fs`. Grep for `.json'`.
- [x] **Top-level bootstrap.** `main.ts`, `cli.ts` and `tinker.ts` can use top-level `await`.
      Replace the `.then().catch()` chains with `await` (or `void` plus a handled rejection), which
      also satisfies `no-floating-promises` in phase 06.
- [x] **Cluster.** `cluster.fork()` re-executes the ESM entry. Confirm that the worker and primary
      branches still split correctly in `SetupClusterService`.

## 4.3 Decorator metadata and circular imports (main risk)

In CJS, a circular import gives `undefined`, so `design:type` silently becomes `undefined`. In ESM,
the same `__metadata("design:type", UserModel)` hits a binding in the temporal dead zone and
**throws `ReferenceError: Cannot access 'UserModel' before initialization` at load time.**

- [x] **Sequelize models.** `AccessTokenModel` ↔ `ClientModel` / `UserModel`, `RefreshTokenModel` →
      `AccessTokenModel`, and `AuthorizationChallengeModel`. Keep the `@BelongsTo(() => X)` thunks,
      and type the association properties through an alias so the emitted metadata is `Object`:

  ```ts
  // src/databases/models/relation.type.ts
  export type Relation<T> = T;            // a type alias does not emit a runtime reference

  @BelongsTo(() => UserModel)
  declare user: Relation<UserModel>;
  ```

  Use `import type` for model classes referenced only in types.
- [x] **sequelize-typescript `models: [glob]`** loads files with `require` and cannot load ESM
      files. Register models from the explicit `DefaultConnectionModels` list
      (`src/databases/model-bootstrap/default-connection-models.ts`) and remove the glob from
      `databases.ts`. AGENTS.md already requires registering each model in that list.
- [x] **Nest providers that use `forwardRef`.** Type the injected parameter as
      `WrapperType<T>` / `Relation<T>` (the Nest ESM docs pattern) so `design:paramtypes` does not
      touch the class binding. `grep -rn "forwardRef" src`.
- [x] **Swagger DTOs and resources** with nested `@Type(() => X)` / `@ApiProperty({ type: () => X })`
      are fine as long as the property type itself does not form a cycle. The boot gate shows
      any that do.

## 4.4 Migrations, seeders, CLI

- [x] Migration files become ESM: `export default { up, down }` or named `export async function up`
      / `down`. Pick one. Update `make-migration/migration.stub` and convert the existing files in
      `src/databases/migrations/`.
- [x] **Fix the runner inconsistency**: `run-migration.service.ts` calls `migration.default.up` but
      `migration.down` (without `default`). Use one shape in run, rollback and refresh.
- [x] Move the umzug loader into one helper, `src/cli-commands/helpers/migration-files.ts`
      (wisekeep has one):
  - [x] glob `*.{ts,js}`, so it works from `src` (tests) and from `dist` (tsgo build, phase 05);
  - [x] store the name with a `.ts` extension in `SequelizeMeta`, even when running the `.js` file.
        Otherwise every migration looks pending and re-runs;
  - [x] load with `import(pathToFileURL(path).href)`;
  - [x] `migration:make` writes into `src/databases/migrations`, never into `dist/`.
- [x] Seeders: the same ESM / `import()` treatment.
- [x] `tinker`: `repl(AppModule)` works under ESM. Confirm that `.load` / history still work.

## 4.5 Tests

- [x] Vitest already runs test files as ESM, so the specs only need the `.js` import extensions.
- [x] `vi.mock('../x.js')` paths must match the new specifiers exactly.
- [x] If `unplugin-swc` is in use, set its module type to `es6` (it already is in the phase 02
      config).

## Check

- `node --enable-source-maps dist/main.js` boots the cluster with no `ReferenceError` and no
  `ERR_REQUIRE_ESM`; `/health` is 200.
- `npm run app:command -- migration:run` reports 0 pending on an up-to-date DB (the `SequelizeMeta`
  names are unchanged). A throwaway migration goes up and down.
- `npm run tinker` and `route:list` work.
- Unit and e2e pass. The OpenAPI JSON is unchanged, which proves the metadata survived.
- `grep -rn "__dirname\|require(" src test` returns nothing (or only commented exceptions).

## Outcome (2026-11-24)

| Check | Result |
| ----- | ------ |
| `tsc -p tsconfig.build.json` / build / lint | ✅ / ✅ (`nest build` emits ESM) / ✅ 0 errors |
| Unit + e2e (vitest) | ✅ 81 files, 276 tests |
| Import every `dist/**/*.js` as native ESM | ✅ 169/169, no TDZ `ReferenceError`, no missing named export |
| Boot `node dist/main.js` | ✅ `/health` 200, `/` renders, API 422s unchanged |
| OpenAPI | identical to phase 03 apart from the operation-id fix below (decorator metadata survived) |
| `migration:run` from `dist/` on the existing DB | ✅ 0 pending (names map to the `.ts` names in `SequelizeMeta`) |
| Throwaway no-op migration | ✅ `make` (into `src/`), `run` and `rollback --till 1` from `dist/`; `SequelizeMeta` restored |
| `route:list`, `tinker` | ✅ / ✅ (REPL `await get(AppService).getHello()`) |

What was done:

- `"type": "module"`. A codemod added `.js` to every relative import in `src` and `test`
  (203 files, no unresolved specifiers). Deep imports into packages without an `exports` map
  also need the extension (`nestjs-sequelize-paginate/dist/...js`, the mailer interface).
- **`nest build` needed no config:** Nest CLI 12 detects `"type": "module"` and SWC emits ESM.
- **`app:command` = `nest build && node dist/cli.js`** (about 3 s). ts-node cannot run ESM
  sources without loader flags, and phase 05 replaces the build with tsgo anyway.
  **`ts-node` and `tsconfig-paths` were removed now** (nothing used them any more), along with
  the `"ts-node"` block in `tsconfig.json`.
- **CommonJS interop:** `import * as Twig from 'twig'` only exposes `default` under native ESM;
  the app crashed at boot (`this.viewEngine.cache is not a function`). `twig` and
  `jsonwebtoken` now use default imports. `jsonwebtoken` was only installed transitively
  (via `@nestjs/jwt`); it is now a declared dependency with `@types/jsonwebtoken`.
- `__dirname` removed: `databases.ts` uses `import.meta.dirname`. The sequelize-typescript
  `models` glob was removed (models come from `DefaultConnectionModels`, the glob loads with
  `require`). New `migrationSourceDirectory` (always `src/databases/migrations`) for
  `migration:make`. The unused `seedingDirectory` was dropped.
- `src/databases/config.ts` (a sequelize-cli `module.exports` config) was deleted: nothing
  imported it and there is no `.sequelizerc`.
- `import MailMessage = require(...)` → `import type` (the file goes away in phase 07).
- **Migrations:** one `MigratorFactoryService` (`src/cli-commands/services/migrator-factory/`)
  replaces three copies of the umzug setup. It lists `*.ts` / `*.js` (no `.d.ts`), records
  compiled files under their `.ts` name, and loads with `import(pathToFileURL(path))`. Unit spec
  on a real temp directory.
  - **Bug fixed:** run used `migration.default.up` but `migration.down`, rollback the reverse;
    one of them always failed.
  - `migration:make` writes into `src/` with `skipVerify` (the CLI runs from `dist/`, so umzug's
    "is it pending?" check could never pass).
  - `'use strict'` removed from migrations and the stub (ESM is always strict).
- **No circular-import TDZ errors.** The model relations (`AccessToken → Client/User`,
  `RefreshToken → AccessToken`, `AuthorizationChallenge → User/Client`) have no cycles and there
  is no `forwardRef`, so the `Relation<T>` alias was not needed. The rule is documented in AGENTS.md
  for future models.
- ESLint `sourceType: 'module'`. AGENTS.md has a new "ES modules" section (`.js` extensions,
  `import.meta.dirname`, default imports for dynamic-CJS packages, migration shape).

**Bug fixed (pre-existing): duplicate Swagger operation ids.** Both OAuth endpoints were published
as `OauthController_` (also in `baseline-openapi.json`): `LoggingDecorator` replaced the method
with an anonymous wrapper, so Swagger read an empty name. Metadata set by decorators applied
before it was also lost. The wrapper now keeps the original name and copies its metadata. Ids are
now `OauthController_token` / `OauthController_refreshAccessToken` (client generators no longer
see a collision). Unit spec added.

**Noted, not fixed:** the umzug logger lines print as `LOG undefined` (LoggingService receives
objects); pre-existing logging issue, out of scope (see README follow-ups, logging upgrade).
