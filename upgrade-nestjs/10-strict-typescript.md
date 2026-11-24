# 10 — Full strict TypeScript

**Status: not started**

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

- [ ] Turn the flags on one at a time, one commit each, in the order of the table (cheapest
      first): `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noUnusedLocals`,
      `noUnusedParameters`, `noImplicitOverride`, `noUncheckedIndexedAccess`,
      `strictPropertyInitialization`, `exactOptionalPropertyTypes`,
      `noPropertyAccessFromIndexSignature`.
- [ ] **`strictPropertyInitialization`** rules for the codebase (write them into AGENTS.md):
  - [ ] **Sequelize models**: use `declare` for columns and associations
        (`@Column declare email: string;`). `declare` emits no class field, so it neither
        shadows the Sequelize getters/setters nor needs an initializer. A class field would shadow
        the attribute accessors, so `declare` is required, not just tidier.
  - [ ] **DTOs**: use a definite-assignment `!` on required properties
        (`@IsString() name!: string;`). The `ValidationPipe` assigns them. Optional fields stay `?`.
  - [ ] **Resources** (`BaseResource` + `@Expose()`): `!`, because class-transformer assigns them.
  - [ ] **Services and lifecycle state** (for example `HashEncryptService.key`, set in
        `onApplicationBootstrap`): `!` with a comment naming the hook that assigns it, or
        restructure so the constructor initializes it.
  - [ ] Do not use `!` to silence a field that really can be missing. Type it `T | undefined`.
- [ ] **`noUncheckedIndexedAccess`**: handle `undefined` explicitly. Prefer early `throw` or a
      default over `!`.
- [ ] **`exactOptionalPropertyTypes`**: check that Swagger `@ApiPropertyOptional` and the DTO
      types still agree. Mapped types (`PartialType` and others) from `@nestjs/swagger` must still
      compile.
- [ ] **`noPropertyAccessFromIndexSignature`**: config loaders read `process.env['KEY']`. App code
      does not read `process.env` (AGENTS.md), so only `src/environment/configs/*` and the test env
      file change.
- [ ] **Remove the unsafe casts** the old setting allowed: `as never` / `as unknown as X` chains
      (for example the session handling in `authorization.controller.ts`). Type the session through
      `express-session` module augmentation (`declare module 'express-session' { interface
      SessionData { … } }`) instead of casting.
- [ ] Config loaders use `satisfies XConfig` instead of `as XConfig`, so a missing key fails to
      compile (started in phase 01 for cluster/cors/databases/view; finish the rest).
- [ ] Add `test/**/*` to `tsconfig.json` `include` (today only `src` is type-checked). Fix the
      155 spec errors left after phase 02 (implicit `any` in mock lambdas, `null` passed where the
      type forbids it).
- [ ] `test/` and the specs compile under the same `tsconfig.json`, with no `// @ts-ignore` left
      (the `connect-flash` one goes away in phase 03). Any `@ts-expect-error` gets a reason.
- [ ] Final tsconfig:

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

- [ ] oxlint: with these flags on, remove any `typescript/*` rule overrides that were turned off
      only because `strictNullChecks`-style information was missing.
- [ ] AGENTS.md: a "TypeScript strictness" section with the `declare` / `!` / `satisfies` rules.

## Check

- `npm run typecheck` (TS 7) and `npx tsc -p tsconfig.json --noEmit` (TS 6) report 0 errors.
- The OpenAPI JSON and `route:list` are unchanged (no runtime effect expected).
- Unit and e2e pass. In particular, the model `declare` change must not change what Sequelize
  reads and writes: the e2e tests that create and read users and OAuth tokens cover it.
