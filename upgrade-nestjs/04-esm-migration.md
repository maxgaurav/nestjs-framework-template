# 04 — CommonJS → native ESM

**Status: not started**

Docs: https://docs.nestjs.com/migration-guide (ESM section). `nest new` now offers an ESM starter
with Vitest and oxlint, and this phase brings the template in line with it.

Goal: `"type": "module"` in `package.json`, so the emitted `dist/*.js` is ESM. The app, CLI, tinker,
migrations and tests all run natively as ESM, and nothing relies on `require(esm)` any more.

## 4.1 Switch

- [ ] `package.json`: `"type": "module"`.
- [ ] tsconfig already has `module` / `moduleResolution: nodenext` and `isolatedModules`. Keep
      `esModuleInterop`. With `"type": "module"`, `nodenext` now emits ESM.
- [ ] Root config files that must stay CommonJS get a `.cjs` extension (check `.prettierrc`, and any
      `*.config.js`). Tool configs that are ESM use `.mjs` / `.mts` (`vitest.config.mts`).
- [ ] `nest-cli.json` and `tsconfig.build.json` do not change because of ESM.

## 4.2 Source changes

- [ ] **Relative import extensions.** Every relative import and export gets `.js`
      (`./app.module.js` for `app.module.ts`). Do it in one mechanical pass: run
      `tsc --noEmit`, fix every TS2835 / TS2834 error with a codemod, and review the diff. Directory
      imports (`./foo` → `./foo/index.js`) need extra care.
- [ ] **`__dirname` / `__filename`** → `import.meta.dirname` / `import.meta.filename`:
  - [ ] `src/environment/configs/databases.ts` (`models`, `migrationDirectory`, `seedingDirectory`);
  - [ ] `grep -rn "__dirname\|__filename\|require(\|require\.\|module\.exports\|exports\." src test`.
- [ ] **`import x = require(...)`**: only `mail-config.service.ts` uses it, and phase 07 deletes
      that file. If phase 07 has not landed yet, change it to a type-only import.
- [ ] **Default vs namespace imports of CJS packages.** Check `import * as Twig from 'twig'`,
      `import * as process from 'process'`, `helmet`, `cls-hooked`, `express-session`,
      `session-file-store` and `bcrypt`. Under ESM, a CJS package's `module.exports` is the
      **default** export, and named exports work only where Node's cjs-module-lexer detects them.
      Fix each import that fails at runtime and keep the change minimal.
- [ ] **JSON imports** need `with { type: 'json' }`, or read the file with `fs`. Grep for `.json'`.
- [ ] **Top-level bootstrap.** `main.ts`, `cli.ts` and `tinker.ts` can use top-level `await`.
      Replace the `.then().catch()` chains with `await` (or `void` plus a handled rejection), which
      also satisfies `no-floating-promises` in phase 06.
- [ ] **Cluster.** `cluster.fork()` re-executes the ESM entry. Confirm that the worker and primary
      branches still split correctly in `SetupClusterService`.

## 4.3 Decorator metadata and circular imports (main risk)

In CJS, a circular import gives `undefined`, so `design:type` silently becomes `undefined`. In ESM,
the same `__metadata("design:type", UserModel)` hits a binding in the temporal dead zone and
**throws `ReferenceError: Cannot access 'UserModel' before initialization` at load time.**

- [ ] **Sequelize models.** `AccessTokenModel` ↔ `ClientModel` / `UserModel`, `RefreshTokenModel` →
      `AccessTokenModel`, and `AuthorizationChallengeModel`. Keep the `@BelongsTo(() => X)` thunks,
      and type the association properties through an alias so the emitted metadata is `Object`:

  ```ts
  // src/databases/models/relation.type.ts
  export type Relation<T> = T;            // a type alias does not emit a runtime reference

  @BelongsTo(() => UserModel)
  declare user: Relation<UserModel>;
  ```

  Use `import type` for model classes referenced only in types.
- [ ] **sequelize-typescript `models: [glob]`** loads files with `require` and cannot load ESM
      files. Register models from the explicit `DefaultConnectionModels` list
      (`src/databases/model-bootstrap/default-connection-models.ts`) and remove the glob from
      `databases.ts`. AGENTS.md already requires registering each model in that list.
- [ ] **Nest providers that use `forwardRef`.** Type the injected parameter as
      `WrapperType<T>` / `Relation<T>` (the Nest ESM docs pattern) so `design:paramtypes` does not
      touch the class binding. `grep -rn "forwardRef" src`.
- [ ] **Swagger DTOs and resources** with nested `@Type(() => X)` / `@ApiProperty({ type: () => X })`
      are fine as long as the property type itself does not form a cycle. The boot gate shows
      any that do.

## 4.4 Migrations, seeders, CLI

- [ ] Migration files become ESM: `export default { up, down }` or named `export async function up`
      / `down`. Pick one. Update `make-migration/migration.stub` and convert the existing files in
      `src/databases/migrations/`.
- [ ] **Fix the runner inconsistency**: `run-migration.service.ts` calls `migration.default.up` but
      `migration.down` (without `default`). Use one shape in run, rollback and refresh.
- [ ] Move the umzug loader into one helper, `src/cli-commands/helpers/migration-files.ts`
      (wisekeep has one):
  - [ ] glob `*.{ts,js}`, so it works from `src` (tests) and from `dist` (tsgo build, phase 05);
  - [ ] store the name with a `.ts` extension in `SequelizeMeta`, even when running the `.js` file.
        Otherwise every migration looks pending and re-runs;
  - [ ] load with `import(pathToFileURL(path).href)`;
  - [ ] `migration:make` writes into `src/databases/migrations`, never into `dist/`.
- [ ] Seeders: the same ESM / `import()` treatment.
- [ ] `tinker`: `repl(AppModule)` works under ESM. Confirm that `.load` / history still work.

## 4.5 Tests

- [ ] Vitest already runs test files as ESM, so the specs only need the `.js` import extensions.
- [ ] `vi.mock('../x.js')` paths must match the new specifiers exactly.
- [ ] If `unplugin-swc` is in use, set its module type to `es6` (it already is in the phase 02
      config).

## Check

- `node --enable-source-maps dist/main.js` boots the cluster with no `ReferenceError` and no
  `ERR_REQUIRE_ESM`; `/health` is 200.
- `npm run app:command -- migration:run` reports 0 pending on an up-to-date DB (the `SequelizeMeta`
  names are unchanged). A throwaway migration goes up and down.
- `npm run tinker` and `route:list` work.
- Unit and e2e pass. The OpenAPI JSON is unchanged, which proves the metadata survived.
- `grep -rn "__dirname\|require(" src test` returns nothing (or only commented exceptions).
