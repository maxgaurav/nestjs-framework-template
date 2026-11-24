# 06 — ESLint → oxlint

**Status: done** on branch `feature/upgrade-nestjs`. See "Outcome" at the end.

New Nest 12 starters use oxlint. Reference: wisekeep phase 06.

## Current setup (`eslint.config.mjs`)

- `@eslint/js` recommended + `typescript-eslint` `recommendedTypeChecked` (`projectService`)
- `eslint-plugin-prettier/recommended` (formatting reported as lint errors)
- Rules: `no-explicit-any` off, `no-floating-promises` warn, `no-unsafe-argument` warn
- Ignores **all specs and `test/**`**, and `overwrite-paginate.service.ts`

## Tasks

- [x] `npm i -D oxlint@^1.95 oxlint-tsgolint@^7.0.2008`. `oxlint-tsgolint` runs the type-aware rules
      on the TS 7 checker and needs no typescript-eslint.
- [x] Try `npx @oxlint/migrate eslint.config.mjs` for a starting point. The flat config may convert
      better than wisekeep's legacy `.eslintrc` did (that produced an almost empty file). Then write
      `.oxlintrc.json` by hand:

  ```jsonc
  {
    "$schema": "./node_modules/oxlint/configuration_schema.json",
    "plugins": ["typescript", "eslint", "unicorn", "import", "node", "promise", "vitest"],
    "categories": { "correctness": "error" },
    "env": { "node": true },
    "rules": {
      "typescript/no-explicit-any": "off",
      "no-unused-vars": ["error", { "caughtErrors": "none" }],
      "typescript/no-floating-promises": "error",
      "typescript/no-unsafe-argument": "warn"
    },
    "overrides": [
      {
        "files": ["**/*.spec.ts", "test/**/*.ts"],
        "env": { "vitest": true },   // check the env name on the pinned oxlint; fallback: "jest" env, or explicit vitest imports
        "rules": { "typescript/no-floating-promises": "off" }
      }
    ],
    "ignorePatterns": ["dist", "coverage", "storage", "src/databases/migrations"]
  }
  ```

- [x] **Parity first, then tighten.** Aim to match today's rule set, not a stricter one.
  - [x] Turn off `typescript/*` rules that need `strictNullChecks` or that report hundreds of
        findings. Wisekeep's list is in its `.oxlintrc.json`. This repo has `strict: true`, so
        fewer of them should be needed.
  - [x] **Specs and `test/` are now linted** (ESLint ignored them). Start them on a lenient
        override; fix only real bugs it finds.
  - [x] Keep `suspicious` off at first. Wisekeep saw 1,500+ findings.
- [-] Optional: `eslint-plugin-sonarjs` through oxlint `jsPlugins`, as wisekeep did. Not part of
      today's config, so only add it if wanted.
- [x] **Disable comments.** Run `oxlint --report-unused-disable-directives`. Convert the comments
      that are still needed (for example `// eslint-disable-next-line @typescript-eslint/ban-ts-comment`)
      to `oxlint-disable-next-line` with a reason, and delete the rest.
- [x] **Prettier** moves out of lint: keep `prettier` + `format`, and add
      `"format:check": "prettier --check \"src/**/*.ts\" \"test/**/*.ts\""`.
- [x] Scripts:

  ```jsonc
  "lint": "oxlint --type-aware --report-unused-disable-directives src test",
  "lint:fix": "oxlint --type-aware --fix src test"
  ```

- [x] Remove `eslint`, `@eslint/js`, `@eslint/eslintrc`, `typescript-eslint`,
      `eslint-plugin-prettier`, `eslint-config-prettier`, `globals` (if it is only used by the
      config) and `eslint.config.mjs`.
- [-] `.idea` / editor: no editor settings are committed; developers install the oxc extension.

## Check

- `npm run lint` passes on a clean tree. Record the time against the ESLint baseline (wisekeep: 12 s
  → 0.8 s).
- A seeded floating promise and an unused variable in a scratch file are both reported.
- `npm run format:check` is clean.

## Outcome (2026-11-24)

- `oxlint` 1.95 + `oxlint-tsgolint` 7.0.2008 (type-aware rules on the TS 7 checker).
- **`@oxlint/migrate` worked well on the flat config:** it expanded `@eslint/js` recommended and
  `typescript-eslint` `recommendedTypeChecked` into **104 rules** (only `no-dupe-args` and
  `no-octal` are unsupported; TypeScript already rejects both). Those rules are kept as migrated,
  for parity, including `no-floating-promises` / `no-unsafe-argument` as warnings.
- Tidied by hand: dropped the `eslint-plugin-prettier` JS plugin (formatting is Prettier's job
  now), replaced 67 generated globals and the CommonJS/Jest environments with `node` + `es2024`,
  and replaced the ignore list (which excluded every spec and all of `test/`).
- **Specs and `test/` are linted for the first time**, through an override that turns off the
  `no-unsafe-*`, `unbound-method`, `require-await` and floating-promise rules for test code. The
  11 findings were fixed (redundant assertions, an unused catch binding, an unused import,
  `Promise.reject()` without an `Error`, `any | …` unions); no assertion changed.
- Disable comments now use oxlint syntax with reasons (3 × passport's `handleRequest` returning
  `any`, 1 × the `req.flash` namespace augmentation). A stale `sonarjs` directive (plugin never
  configured) was removed. `--report-unused-disable-directives` is part of `npm run lint`.
- Scripts: `lint`, `lint:fix`, `format:check`. Removed `eslint`, `@eslint/js`, `@eslint/eslintrc`,
  `typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-prettier`, `globals` and
  `eslint.config.mjs`. TypeScript 6 is now only needed by the Nest schematics and the IDE.

| Check | Result |
| ----- | ------ |
| `npm run lint` | ✅ 0 errors; the same 6 app-code warnings ESLint reported |
| Time | **0.45 s** (ESLint: 3.6–10.7 s) |
| Seeded probe | unused variable and floating promise both reported |
| `npm run format:check` | ✅ clean |
| Unit + e2e | ✅ 276 tests |

**Not done (parity first):** `no-floating-promises` stays a warning in app code, as under ESLint.
The 6 warnings (5 × `no-unsafe-argument` around passport/`any` bodies, 1 floating promise in
`SetupClusterService`) are candidates for phase 10, where strict typing removes most `any`s.
