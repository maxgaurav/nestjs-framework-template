# 01 — Baseline, Node 26, tsconfig cleanup

**Status: done** on branch `feature/upgrade-nestjs`. See "Outcome" at the end.

Goal: record where we start, and prepare the toolchain while the app is still on Nest 11.

## Tasks

- [x] **Branch** `feature/upgrade-nestjs` from `master`.
- [x] **Record the baseline** in `upgrade-nestjs/baseline.md`:
  - [x] pass/fail of `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`, with failing
        suite names (CI has tests switched off, so expect failures);
  - [x] `npm run app:command -- route:list` → `upgrade-nestjs/baseline-routes.txt`;
  - [x] `GET /api-documentation/v1-json` → `upgrade-nestjs/baseline-openapi.json`;
  - [x] boot time of `npm run start:dev`, and the `npm run build` / `npm run lint` wall times.
- [x] **Node 26 LTS.**
  - [x] `.nvmrc` → `v26`. Add `"engines": { "node": ">=26" }` to `package.json`.
  - [x] `@types/node` → `^26`.
  - [x] `bcrypt` 5 → 6 (N-API prebuilds, same hash format). (`@types/bcrypt` stays: bcrypt 6 does NOT ship
        its own types.)
  - [x] `rm -rf node_modules && npm ci` under Node 26.
  - [x] npm 11 (bundled with Node 26) blocks install scripts by default. Add `allowScripts` to
        `package.json`: approve `bcrypt` and `@swc/core`; deny `@nestjs/core` (banner only).
  - [x] Boot with `node --trace-deprecation` and note the warnings. `connect-flash` triggers
        `DEP0044` (`util.isArray`); it is replaced in phase 03.
- [x] **tsconfig cleanup** (already TS 6 + `nodenext` after `f62f6cf`):
  - [x] Remove `declaration` / `declarationDir` (app, not a library).
  - [x] `target` → `ES2023`. If `ts-node --swc` rejects it (wisekeep hit
        `jsc.target should be es5 or upper`), stay on `ES2022` until phase 05 removes ts-node.
  - [x] Set `"types": ["node"]` explicitly (TS 6+ defaults to `[]`). Phase 02 adds `vitest/globals`.
  - [-] Remove the `"ts-node"` block when phase 05 removes ts-node. Keep it for now.
  - [x] `tsconfig.build.json`: `"rootDir": "./src"`, `"include": ["src/**/*"]`, exclude `test` and
        `**/*.spec.ts`, so `dist/main.js` (not `dist/src/main.js`) stays the entry.
- [x] **Dependency hygiene** (no behaviour change):
  - [x] Move `@types/cls-hooked`, `@types/page`, `@types/pg` to `devDependencies`. Remove
        `@types/page` if nothing uses it.
  - [x] Move `nestjs-cls` to `dependencies`; `LoggingService`, the template functions and
        `DatabaseConfigService` use it at runtime.
  - [x] Remove the stale type packages: `@types/sequelize`, `@types/umzug`, and `@types/uuid` if
        `uuid` is not imported.
  - [x] Remove `ts-jest` and `ts-loader`. Both are unused, and `ts-jest` peers on `typescript <6`.

## Check

- `npx tsc -p tsconfig.json --noEmit` shows no new errors compared with the baseline.
- `npm run build`, `npm run start:dev` and `npm run app:command -- route:list` work on Node 26.
- Test results are the same as the baseline.

## Outcome (2026-11-24)

| Check | Result |
| ----- | ------ |
| Node | 26.13.1 / npm 11.20. `.nvmrc` `v26`, `engines.node` `>=26` |
| `npx tsc -p tsconfig.build.json --noEmit` | 0 errors |
| `npx tsc -p tsconfig.json --noEmit` | 158 errors, all in spec files (was 1,212 on `master`, which had no test-runner types at all). Fixed by the phase 02 port |
| `npm run build` | ✅ |
| `npm run lint` | ✅ 0 errors, 7 warnings (same as baseline) |
| Unit (inline SWC options) | same as baseline: 8 failed / 66 passed suites, 25 failed / 217 passed tests |
| `route:list` / `migration:run` | ✅ |

How this differs from the plan:

- **bcrypt 6 does not ship its own types** (the wisekeep note was wrong). `@types/bcrypt` stays.
- **`typescript-eslint` was bumped to `^8.74`** (peer `typescript <6.1`). The old 8.52 lock entry,
  together with `ts-jest` (peer `typescript <6`), blocked every npm install after the TS 6 commit.
  The bump flagged 5 new `no-unnecessary-type-assertion` errors:
  - 4 config loaders now use `satisfies XConfig` instead of `as XConfig`. A missing key still fails
    to compile; the cast would have hidden it;
  - one redundant `as never` was removed in `authorization.controller.ts`.
- **`allowScripts`**: approved `bcrypt` and `@swc/core`; denied `@nestjs/core` (banner) and
  `@scarf/scarf` (telemetry).
- `tsconfig.json` `types` is `["node", "jest"]` until phase 02 swaps `jest` for `vitest/globals`.
- `target` `ES2023` works with `ts-node --swc` on this setup, so the `ES2022` fallback was not needed.
- `nestjs-cls` was moved to `dependencies` and kept on `^6.2.0`. Phase 03 bumps it to 7.
- Boot under Node 26 shows the expected `DEP0044` from `connect-flash` (replaced in phase 03).
