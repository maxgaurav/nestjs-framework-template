# 06 — ESLint → oxlint

**Status: not started**

New Nest 12 starters use oxlint. Reference: wisekeep phase 06.

## Current setup (`eslint.config.mjs`)

- `@eslint/js` recommended + `typescript-eslint` `recommendedTypeChecked` (`projectService`)
- `eslint-plugin-prettier/recommended` (formatting reported as lint errors)
- Rules: `no-explicit-any` off, `no-floating-promises` warn, `no-unsafe-argument` warn
- Ignores **all specs and `test/**`**, and `overwrite-paginate.service.ts`

## Tasks

- [ ] `npm i -D oxlint@^1.95 oxlint-tsgolint@^7.0.2008`. `oxlint-tsgolint` runs the type-aware rules
      on the TS 7 checker and needs no typescript-eslint.
- [ ] Try `npx @oxlint/migrate eslint.config.mjs` for a starting point. The flat config may convert
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

- [ ] **Parity first, then tighten.** Aim to match today's rule set, not a stricter one.
  - [ ] Turn off `typescript/*` rules that need `strictNullChecks` or that report hundreds of
        findings. Wisekeep's list is in its `.oxlintrc.json`. This repo has `strict: true`, so
        fewer of them should be needed.
  - [ ] **Specs and `test/` are now linted** (ESLint ignored them). Start them on a lenient
        override; fix only real bugs it finds.
  - [ ] Keep `suspicious` off at first. Wisekeep saw 1,500+ findings.
- [ ] Optional: `eslint-plugin-sonarjs` through oxlint `jsPlugins`, as wisekeep did. Not part of
      today's config, so only add it if wanted.
- [ ] **Disable comments.** Run `oxlint --report-unused-disable-directives`. Convert the comments
      that are still needed (for example `// eslint-disable-next-line @typescript-eslint/ban-ts-comment`)
      to `oxlint-disable-next-line` with a reason, and delete the rest.
- [ ] **Prettier** moves out of lint: keep `prettier` + `format`, and add
      `"format:check": "prettier --check \"src/**/*.ts\" \"test/**/*.ts\""`.
- [ ] Scripts:

  ```jsonc
  "lint": "oxlint --type-aware --report-unused-disable-directives src test",
  "lint:fix": "oxlint --type-aware --fix src test"
  ```

- [ ] Remove `eslint`, `@eslint/js`, `@eslint/eslintrc`, `typescript-eslint`,
      `eslint-plugin-prettier`, `eslint-config-prettier`, `globals` (if it is only used by the
      config) and `eslint.config.mjs`.
- [ ] `.idea` / editor: switch to the oxc extension.

## Check

- `npm run lint` passes on a clean tree. Record the time against the ESLint baseline (wisekeep: 12 s
  → 0.8 s).
- A seeded floating promise and an unused variable in a scratch file are both reported.
- `npm run format:check` is clean.
