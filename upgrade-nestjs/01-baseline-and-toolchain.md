# 01 — Baseline, Node 26, tsconfig cleanup

**Status: not started**

Goal: record where we start, and prepare the toolchain while the app is still on Nest 11.

## Tasks

- [ ] **Branch** `chore/upgrade-nestjs-12` from `master`.
- [ ] **Record the baseline** in `upgrade-nestjs/baseline.md`:
  - [ ] pass/fail of `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`, with failing
        suite names (CI has tests switched off, so expect failures);
  - [ ] `npm run app:command -- route:list` → `upgrade-nestjs/baseline-routes.txt`;
  - [ ] `GET /api-documentation/v1-json` → `upgrade-nestjs/baseline-openapi.json`;
  - [ ] boot time of `npm run start:dev`, and the `npm run build` / `npm run lint` wall times.
- [ ] **Node 26 LTS.**
  - [ ] `.nvmrc` → `v26`. Add `"engines": { "node": ">=26" }` to `package.json`.
  - [ ] `@types/node` → `^26`.
  - [ ] `bcrypt` 5 → 6 (N-API prebuilds, same hash format). Remove `@types/bcrypt`; bcrypt 6 ships
        its own types.
  - [ ] `rm -rf node_modules && npm ci` under Node 26.
  - [ ] npm 11 (bundled with Node 26) blocks install scripts by default. Add `allowScripts` to
        `package.json`: approve `bcrypt` and `@swc/core`; deny `@nestjs/core` (banner only).
  - [ ] Boot with `node --trace-deprecation` and note the warnings. `connect-flash` triggers
        `DEP0044` (`util.isArray`); it is replaced in phase 03.
- [ ] **tsconfig cleanup** (already TS 6 + `nodenext` after `f62f6cf`):
  - [ ] Remove `declaration` / `declarationDir` (app, not a library).
  - [ ] `target` → `ES2023`. If `ts-node --swc` rejects it (wisekeep hit
        `jsc.target should be es5 or upper`), stay on `ES2022` until phase 05 removes ts-node.
  - [ ] Set `"types": ["node"]` explicitly (TS 6+ defaults to `[]`). Phase 02 adds `vitest/globals`.
  - [ ] Remove the `"ts-node"` block when phase 05 removes ts-node. Keep it for now.
  - [ ] `tsconfig.build.json`: `"rootDir": "./src"`, `"include": ["src/**/*"]`, exclude `test` and
        `**/*.spec.ts`, so `dist/main.js` (not `dist/src/main.js`) stays the entry.
- [ ] **Dependency hygiene** (no behaviour change):
  - [ ] Move `@types/cls-hooked`, `@types/page`, `@types/pg` to `devDependencies`. Remove
        `@types/page` if nothing uses it.
  - [ ] Move `nestjs-cls` to `dependencies`; `LoggingService`, the template functions and
        `DatabaseConfigService` use it at runtime.
  - [ ] Remove the stale type packages: `@types/sequelize`, `@types/umzug`, and `@types/uuid` if
        `uuid` is not imported.
  - [ ] Remove `ts-jest` and `ts-loader`. Both are unused, and `ts-jest` peers on `typescript <6`.

## Check

- `npx tsc -p tsconfig.json --noEmit` shows no new errors compared with the baseline.
- `npm run build`, `npm run start:dev` and `npm run app:command -- route:list` work on Node 26.
- Test results are the same as the baseline.
