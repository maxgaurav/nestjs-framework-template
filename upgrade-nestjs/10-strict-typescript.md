# 10 — Full strict TypeScript

**Status: done** on branch `feature/upgrade-nestjs`. See "Outcome" at the end.

Goal: the strictest practical compiler settings for `src` and `test`, so the template starts every
project with them. `strict: true` is already on; this phase removes the
`strictPropertyInitialization: false` opt-out and adds the checks that `strict` does not include.

Measured on 2026-11-24 (TS 6, `tsconfig.build.json`, `src` only, after phase 01). Spec and `test/`
counts come on top of these and are fixed together with the Vitest port.

| Flag                                 | Errors in `src` | Notes |
| ------------------------------------ | --------------- | ----- |
| `strictPropertyInitialization`       | 31 | Sequelize model columns, DTO/resource fields, injected-later fields |
| `noImplicitOverride`                 | 10 | Add `override` on subclass members (`BaseModel`, `BaseResource`, filters, strategies) |
| `noImplicitReturns`                  | 1  | |
| `noFallthroughCasesInSwitch`         | 0  | Enable now, it is free |
| `noUncheckedIndexedAccess`           | 11 | Indexed config maps, `split()` results, header lookups |
| `exactOptionalPropertyTypes`         | 25 | `prop?: T` assigned `undefined`. Use `prop?: T \| undefined` where `undefined` is meaningful |
| `noPropertyAccessFromIndexSignature` | 59 | Mostly `process.env.X` → `process.env['X']` in config loaders |
| `noUnusedLocals` / `noUnusedParameters` | 1 / 5 | Overlaps with oxlint `no-unused-vars`; keep both so `tsc` alone catches them |
| `useUnknownInCatchVariables`         | (in `strict`) | Already on |

## Order

Run this phase **after phase 05** (TS 7), so that one compiler is the source of truth, and **before
phase 09**, so CI enforces it. It does not depend on mail or storage, but if 07/08 land first,
their new code must already compile under these flags.

## Tasks

- [x] Turn the flags on one at a time, one commit each, in the order of the table (cheapest
      first): `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noUnusedLocals`,
      `noUnusedParameters`, `noImplicitOverride`, `noUncheckedIndexedAccess`,
      `strictPropertyInitialization`, `exactOptionalPropertyTypes`,
      `noPropertyAccessFromIndexSignature`.
- [x] **`strictPropertyInitialization`** rules for the codebase (write them into AGENTS.md):
  - [x] **Sequelize models**: use `declare` for columns and associations
        (`@Column declare email: string;`). `declare` emits no class field, so it neither
        shadows the Sequelize getters/setters nor needs an initializer. A class field would shadow
        the attribute accessors, so `declare` is required, not just tidier.
  - [x] **DTOs**: use a definite-assignment `!` on required properties
        (`@IsString() name!: string;`). The `ValidationPipe` assigns them. Optional fields stay `?`.
  - [x] **Resources** (`BaseResource` + `@Expose()`): `!`, because class-transformer assigns them.
  - [x] **Services and lifecycle state** (for example `HashEncryptService.key`, set in
        `onApplicationBootstrap`): `!` with a comment naming the hook that assigns it, or
        restructure so the constructor initializes it.
  - [x] Do not use `!` to silence a field that really can be missing. Type it `T | undefined`.
- [x] **`noUncheckedIndexedAccess`**: handle `undefined` explicitly. Prefer early `throw` or a
      default over `!`.
- [-] **`exactOptionalPropertyTypes`** (not enabled; see Outcome): check that Swagger `@ApiPropertyOptional` and the DTO
      types still agree. Mapped types (`PartialType` and others) from `@nestjs/swagger` must still
      compile.
- [x] **`noPropertyAccessFromIndexSignature`**: config loaders read `process.env['KEY']`. App code
      does not read `process.env` (AGENTS.md), so only `src/environment/configs/*` and the test env
      file change.
- [x] **Remove the unsafe casts** the old setting allowed: `as never` / `as unknown as X` chains
      (for example the session handling in `authorization.controller.ts`). Type the session through
      `express-session` module augmentation (`declare module 'express-session' { interface
      SessionData { … } }`) instead of casting.
- [x] Config loaders use `satisfies XConfig` instead of `as XConfig`, so a missing key fails to
      compile (started in phase 01 for cluster/cors/databases/view; finish the rest).
- [x] Add `test/**/*` to `tsconfig.json` `include` (today only `src` is type-checked). Fix the
      155 spec errors left after phase 02 (implicit `any` in mock lambdas, `null` passed where the
      type forbids it).
- [x] `test/` and the specs compile under the same `tsconfig.json`, with no `// @ts-ignore` left
      (the `connect-flash` one goes away in phase 03). Any `@ts-expect-error` gets a reason.
- [x] Final tsconfig:

  ```jsonc
  "strict": true,
  "noImplicitOverride": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noPropertyAccessFromIndexSignature": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
  // removed: "strictPropertyInitialization": false, the redundant "noImplicitAny": true
  ```

- [x] oxlint: fix the 6 warnings left from phase 06 (5 × `no-unsafe-argument`, 1 floating promise
      in `SetupClusterService`) and raise `no-floating-promises` / `no-unsafe-argument` to errors.
- [x] oxlint: with these flags on, remove any `typescript/*` rule overrides that were turned off
      only because `strictNullChecks`-style information was missing.
- [x] AGENTS.md: a "TypeScript strictness" section with the `declare` / `!` / `satisfies` rules.

## Check

- `npm run typecheck` (TS 7) and `npx tsc -p tsconfig.json --noEmit` (TS 6) report 0 errors.
- The OpenAPI JSON and `route:list` are unchanged (no runtime effect expected).
- Unit and e2e pass. In particular, the model `declare` change must not change what Sequelize
  reads and writes: the e2e tests that create and read users and OAuth tokens cover it.

## Outcome (2026-11-24)

Final `compilerOptions`: `strict`, `noFallthroughCasesInSwitch`, `noImplicitReturns`,
`noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noUncheckedIndexedAccess`,
`noPropertyAccessFromIndexSignature`. `strictPropertyInitialization: false` and the redundant
`noImplicitAny` are gone. `tsconfig.json` now includes `test/**`.

**`exactOptionalPropertyTypes` is not enabled** (decided with the project owner). 31 errors, about
25 of them the same: every repository passes `{ transaction }` (`Transaction | undefined`) to
Sequelize, whose typings declare `transaction?: Transaction | null`; `node:tls`,
class-validator and `@nestjs/storage` options behave the same. Library typings are not written
for the flag, and a helper or inline spreads would add noise to every repository call without
making anything safer. Documented in AGENTS.md.

| Check | Result |
| ----- | ------ |
| `npm run typecheck` (TS 7) / `tsc --noEmit` (TS 6) | ✅ 0 / 0 errors across `src` + `test` (was 151 in specs and about 190 more with the flags) |
| `npm run lint` | ✅ 0 errors, **0 warnings**; `no-floating-promises` and `no-unsafe-argument` raised to errors |
| Unit + e2e | ✅ 295 tests |
| Build / boot / OpenAPI / routes | ✅ / `/health` 200 / identical to phase 05 / baseline + the phase 08 `/files/:disk` route |

Done one flag per commit. What the stricter checks found (beyond mechanical fixes):

- **Bug: `AccessTokenModel.client` / `.user` were class fields.** With `target: ES2023` they are
  re-initialised after Sequelize's constructor, so an eager-loaded association
  (`findForActiveState` includes `ClientModel`) was always `undefined`. Now `declare`.
  Regression e2e (`oauth-token.e2e-spec.ts`) fails without the fix.
- **Missing `APP_SECRET` went unnoticed.** `system.secret` / `session.secret` were typed `string`
  through `as` casts but were `undefined` without the variable; the session secret fell back to
  `''`, and `HashEncryptService` / storage signing derive keys from it. Config loaders now use
  `satisfies`, and `requiredEnv('APP_SECRET')` fails at boot with a clear message.
  `SESSION_DRIVER` no longer accepts arbitrary strings.
- **Session typing never worked.** `src/express.d.ts` augmented a global `session` namespace
  that `express-session` does not read, so every session access needed `as never`. It now
  augments `express-session`'s `SessionData` (`_previous`, `passwordContent`); the casts are gone.
- **Test bugs:** specs built `RefreshTokenDto` with a constructor argument it does not take
  (fields `undefined`, assertions passed vacuously); a mock created an unhandled rejected
  promise instead of returning it; guard specs passed booleans as the execution context.
- `SetupClusterService` passes the bootstrap function directly and handles its rejection (was a
  stored field plus a floating promise). Unused injections/parameters removed or prefixed with
  `_`. `CommandToSystemEvent` is a typed literal.
- AGENTS.md has a new "TypeScript strictness" section (`declare` on model columns and
  associations, `!` on DTO/resource fields, `satisfies` + `requiredEnv` in config loaders, typed
  `SessionData`, why `exactOptionalPropertyTypes` is off).

**Breaking for local environments:** the app (and CLI) now refuses to start without
`APP_SECRET`. `.env.example` already sets it.
