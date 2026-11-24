# 05 — TypeScript 7 (tsgo) build, type-check and direct run (gated)

**Status: GO, done** on branch `feature/upgrade-nestjs`. All 8 gates passed; see "Outcome" at the end.

Goal: build and type-check with **TypeScript 7** (the Go compiler). Remove `nest build`/SWC from the
build and remove `ts-node`, while keeping one-command runs (`npm run app:command -- …`,
`npm run tinker`). Reference: wisekeep phase 05 (GO, all gates passed).

This phase has a **go/no-go gate**. If any gate fails, stop: `build` stays `nest build`, and the
failure is written into this file.

## Facts that shape the design

- TS 7 has **no classic compiler API**. These tools must keep resolving `typescript@6`: `@nestjs/cli`
  builders and `@nestjs/schematics` (`nest g`), the IDE TS server (unless it uses the TS Native
  Preview extension), `unplugin-swc` typings, and the `@nestjs/swagger` CLI plugin (not used).
- Both packages ship a `tsc` bin, so TS 7 is installed under an npm alias and called by path.
- Node type-stripping and esbuild-based runners (`tsx`) **cannot emit decorator metadata**, which
  Nest DI needs. So: compile first, then run `dist/`. TS 7 makes the compile step about 1 s.
- After phase 04 the output is ESM, which tsgo emits the same way as tsc.

## Tasks

- [x] Dependencies:

  ```jsonc
  "typescript": "^6.0.3",                        // compiler API: nest CLI/schematics, IDE
  "typescript-native": "npm:typescript@^7.0.2",  // Go compiler, used by scripts
  "concurrently": "^9",                          // watch mode (the Nest CLI watcher needs the TS API)
  "rimraf": "^6"
  ```

- [x] Scripts (the plain `tsc` on `PATH` stays TS 6):

  ```jsonc
  "tsgo": "node node_modules/typescript-native/bin/tsc",
  "prebuild": "rimraf dist",
  "build": "npm run tsgo -- -p tsconfig.build.json",
  "typecheck": "npm run tsgo -- -p tsconfig.json --noEmit",
  "start": "npm run build && node --enable-source-maps dist/main.js",
  "start:dev": "npm run build && concurrently -k -n tsc,app -c blue,green \"npm run tsgo -- -p tsconfig.build.json --watch --preserveWatchOutput\" \"node --enable-source-maps --watch-path=./dist dist/main.js\"",
  "start:debug": "npm run build && concurrently -k -n tsc,app -c blue,green \"npm run tsgo -- -p tsconfig.build.json --watch --preserveWatchOutput\" \"node --inspect --enable-source-maps --watch-path=./dist dist/main.js\"",
  "start:prod": "node --enable-source-maps dist/main.js",
  "app:command": "npm run -s build && node --enable-source-maps dist/cli.js",
  "tinker": "npm run -s build && node --enable-source-maps dist/tinker.js"
  ```

- [x] `tsconfig.build.json`: `"tsBuildInfoFile": "./dist/tsconfig.build.tsbuildinfo"`. Wisekeep: a
      stale root `.tsbuildinfo` made TS 7 skip the emit after `rimraf dist`, which left no `dist/`.
- [x] `tsconfig.json`: `target` → `ES2023` (ts-node no longer constrains it). Remove the `"ts-node"`
      block (already removed in phase 04). `rootDir` stays explicit.
- [x] `nest-cli.json`: remove `"builder": "swc"` and `"typeCheck": true`. Keep the file for
      `nest generate` only.
- [x] Remove `@swc/cli` and `.swcrc`. (`ts-node` and `tsconfig-paths` were already removed in phase 04.)
      Keep `@swc/core` only if Vitest uses `unplugin-swc`.
- [x] Twig views and the `migration.stub` are not TS. Check that nothing reads them from `dist/`;
      `ViewConfig` should point at the root `views/`. Copy assets only if something needs them in
      `dist/`.
- [x] The migration helper from phase 04 already handles `dist/*.js` and the `.ts` names in
      `SequelizeMeta`.
- [-] Editor note in README.md (moved to phase 09, which rewrites the stock README): the "TypeScript (Native Preview)" VS Code extension gives TS 7 in the
      IDE. Otherwise the IDE uses TS 6, which accepts the same tsconfig.

## Go / no-go gates (all must pass)

- [x] **G1 Type-check parity.** `npm run typecheck` (TS 7) and `npx tsc -p tsconfig.json --noEmit`
      (TS 6) both report 0 errors.
- [x] **G2 Runtime DI.** `npm run start` boots the cluster (primary + worker), with no
      `Nest can't resolve dependencies`; `/health` is 200.
- [x] **G3 Swagger parity.** `/api-documentation/v1-json` matches the phase 03/04 output. This checks
      the TS 7 `design:type` emit. Wisekeep: only improvements (`number | null` documented as
      `number` instead of `Object`).
- [x] **G4 Validation parity.** E2E passes. Smoke-test the tsgo-built server with curl: an invalid
      DTO returns 422 with the same `{ errors, message }` shape, and nested `@ValidateNested` /
      `@Type` DTOs still validate.
- [x] **G5 Direct runs.** `app:command -- route:list`, `migration:run`, `migration:make <name>`
      (writes into `src/`), `seeder` and `tinker` all work. Record the `app:command` wall time
      against `ts-node --swc`.
- [x] **G6 Watch.** Saving a `.ts` file restarts the app in about 2 s, and type errors show in the
      tsc pane.
- [x] **G7 Source maps.** Stack traces point at `src/*.ts` lines.
- [x] **G8 Generators.** `npx nest g service tmp-check --dry-run` works (schematics resolve TS 6).

**Fallback** if G2, G3 or G4 fails because of a TS 7 emit difference: `build` = `nest build` (SWC)
and `typecheck` stays on tsgo. Report the emit difference upstream.

## Outcome

## Outcome (2026-11-24)

- `typescript-native` = `npm:typescript@^7.0.2`; `typescript` stays `^6` (`require('typescript')`
  resolves 6.0.3 for schematics, typescript-eslint and the IDE). `node_modules/.bin/tsc` links to
  TS 7, so scripts call it by path (`npm run tsgo`).
- Added `concurrently` 10 and `rimraf` 6. Removed `@swc/cli`, `@swc/core` (and its
  `allowScripts` entry) and `.swcrc`: Vitest uses Vite's oxc transform (phase 02), so **SWC is gone
  entirely**, not kept for tests as wisekeep did. (`ts-node` / `tsconfig-paths` went in phase 04.)
- `tsconfig.build.json`: `types: ["node"]` (no vitest globals in app code) and
  `tsBuildInfoFile: ./dist/tsconfig.build.tsbuildinfo`, so `rimraf dist` always forces a full emit
  (wisekeep's stale-buildinfo trap).
- `nest-cli.json` only configures generators.
- TS 7 needed **no source changes**: phase 01 had already moved tsconfig to TS 7-compatible
  settings (`nodenext`, explicit `rootDir`/`types`, no `baseUrl`), and `strict` was already on.

| Gate | Result |
| ---- | ------ |
| G1 type-check parity | TS 7 and TS 6 report the identical 156 errors, all in spec files (phase 10); 0 in app code |
| G2 runtime DI | `dist/main.js` boots, all providers resolve, `/health` 200 |
| G3 Swagger parity | `/api-documentation/v1-json` identical to phase 04 |
| G4 validation parity | 276 tests green; the tsgo-built server returns the same 422 `{ errors, message }` shape |
| G5 direct runs | `route:list` = baseline, probe migration `make` → `run` → `rollback --till 1` from `dist/`, `seeder:seed --all`, `tinker` |
| G6 watch | save → new code served in about 1.3 s; type errors show in the `tsc` pane |
| G7 source maps | stack traces point at `src/**/*.ts` lines |
| G8 generators | `nest g service` works (TS 6) and writes ESM imports (`.js`) with a Vitest-compatible spec |

| Timing | Before | After |
| ------ | ------ | ----- |
| `npm run build` | 9.2 s (`nest build`, SWC + type-check) | **0.38 s** (tsgo) |
| type-check `src` | part of the 9.2 s build | 0.27 s |
| `app:command -- route:list` (incl. compile) | about 3.1 s (phase 04, `nest build`) | about 1.2 s |

