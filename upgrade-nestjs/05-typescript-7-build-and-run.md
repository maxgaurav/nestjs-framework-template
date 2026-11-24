# 05 — TypeScript 7 (tsgo) build, type-check and direct run (gated)

**Status: not started**

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

- [ ] Dependencies:

  ```jsonc
  "typescript": "^6.0.3",                        // compiler API: nest CLI/schematics, IDE
  "typescript-native": "npm:typescript@^7.0.2",  // Go compiler, used by scripts
  "concurrently": "^9",                          // watch mode (the Nest CLI watcher needs the TS API)
  "rimraf": "^6"
  ```

- [ ] Scripts (the plain `tsc` on `PATH` stays TS 6):

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

- [ ] `tsconfig.build.json`: `"tsBuildInfoFile": "./dist/tsconfig.build.tsbuildinfo"`. Wisekeep: a
      stale root `.tsbuildinfo` made TS 7 skip the emit after `rimraf dist`, which left no `dist/`.
- [ ] `tsconfig.json`: `target` → `ES2023` (ts-node no longer constrains it). Remove the `"ts-node"`
      block (already removed in phase 04). `rootDir` stays explicit.
- [ ] `nest-cli.json`: remove `"builder": "swc"` and `"typeCheck": true`. Keep the file for
      `nest generate` only.
- [ ] Remove `@swc/cli` and `.swcrc`. (`ts-node` and `tsconfig-paths` were already removed in phase 04.)
      Keep `@swc/core` only if Vitest uses `unplugin-swc`.
- [ ] Twig views and the `migration.stub` are not TS. Check that nothing reads them from `dist/`;
      `ViewConfig` should point at the root `views/`. Copy assets only if something needs them in
      `dist/`.
- [ ] The migration helper from phase 04 already handles `dist/*.js` and the `.ts` names in
      `SequelizeMeta`.
- [ ] Editor note in README.md: the "TypeScript (Native Preview)" VS Code extension gives TS 7 in the
      IDE. Otherwise the IDE uses TS 6, which accepts the same tsconfig.

## Go / no-go gates (all must pass)

- [ ] **G1 Type-check parity.** `npm run typecheck` (TS 7) and `npx tsc -p tsconfig.json --noEmit`
      (TS 6) both report 0 errors.
- [ ] **G2 Runtime DI.** `npm run start` boots the cluster (primary + worker), with no
      `Nest can't resolve dependencies`; `/health` is 200.
- [ ] **G3 Swagger parity.** `/api-documentation/v1-json` matches the phase 03/04 output. This checks
      the TS 7 `design:type` emit. Wisekeep: only improvements (`number | null` documented as
      `number` instead of `Object`).
- [ ] **G4 Validation parity.** E2E passes. Smoke-test the tsgo-built server with curl: an invalid
      DTO returns 422 with the same `{ errors, message }` shape, and nested `@ValidateNested` /
      `@Type` DTOs still validate.
- [ ] **G5 Direct runs.** `app:command -- route:list`, `migration:run`, `migration:make <name>`
      (writes into `src/`), `seeder` and `tinker` all work. Record the `app:command` wall time
      against `ts-node --swc`.
- [ ] **G6 Watch.** Saving a `.ts` file restarts the app in about 2 s, and type errors show in the
      tsc pane.
- [ ] **G7 Source maps.** Stack traces point at `src/*.ts` lines.
- [ ] **G8 Generators.** `npx nest g service tmp-check --dry-run` works (schematics resolve TS 6).

**Fallback** if G2, G3 or G4 fails because of a TS 7 emit difference: `build` = `nest build` (SWC)
and `typecheck` stays on tsgo. Report the emit difference upstream.

## Outcome

_(fill in gate results and timings)_
