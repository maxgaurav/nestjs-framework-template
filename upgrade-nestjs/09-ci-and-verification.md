# 09 — CI, AGENTS.md, final verification

**Status: not started**

## CI (`.github/workflows/node.js.yml`)

- [ ] Node `26.x`, `npm ci` (not `npm install`), and **re-enable tests**:

  ```yaml
  strategy:
    matrix:
      node-version: [26.x]
  steps:
    - uses: actions/checkout@v6
    - uses: actions/setup-node@v6
      with: { node-version: ${{ matrix.node-version }}, cache: npm }
    - run: npm ci
    - run: npm run format:check
    - run: npm run lint
    - run: npm run typecheck
    - run: npm test
    - run: npm run build
  ```

- [ ] Optional: an `e2e` job with a `postgres` service container that runs
      `npm run app:command -- migration:run`, then `npm run test:e2e`.

## AGENTS.md updates

- [ ] **Stack**: Nest 12, native ESM (`.js` import extensions, `import.meta.dirname`), Node 26.
- [ ] **Build/run**: `npm run build` (tsgo), `typecheck`, `start:dev`; `app:command` compiles and
      then runs `dist/cli.js`.
- [ ] **CLI commands**: `nest-commander` (`@Command` + `CommandRunner`, `@Option`), thin command +
      service, registration in `CliCommandsModule`.
- [ ] **Lint/format**: oxlint (`npm run lint`), prettier (`format`, `format:check`).
- [ ] **Testing**: Vitest (`npm test`, `npm run test:e2e`), `basicE2eSetup` +
      `managedTransaction` (one rolled-back transaction per test, joined via cls-hooked), and the
      in-memory mail/storage overrides.
- [ ] **Mail**: Mailable classes + `MailService.send`, Twig templates in `views/emails/`.
- [ ] **Storage**: `@nestjs/storage` disks (`StorageDisks` constants, `@InjectDisk`),
      `StorageErrorFilter`, and uploads validated by `nestjs-form-data` DTOs and persisted through
      `FileStorageService`.
- [ ] **Models**: ESM circular-import rule (the `Relation<T>` alias on association properties), and
      registration in `DefaultConnectionModels` is required (there is no glob any more).
- [ ] **Migrations**: ESM migration shape.

## Final checklist

- [ ] Clean clone: `npm ci && npm run build && npm run start:prod` boots (cluster), and `/health`
      is 200.
- [ ] `format:check`, `lint`, `typecheck`, `test` and `test:e2e` are all green.
- [ ] `route:list` and the OpenAPI JSON match the baselines (only intentional diffs, listed in the
      PR).
- [ ] Web flow: login → session/flash → redirect-to-login, in a browser.
- [ ] API flow: OAuth password grant, refresh, the user CRUD endpoints, pagination.
- [ ] Mail via Mailpit (SMTP) and the log driver.
- [ ] Storage: local disks created; signed link downloads, supports Range and returns 403 when
      tampered with; upload validation returns 422.
- [ ] Migrations: `migration:run` on an existing DB shows 0 pending; `make` / `rollback` /
      `refresh` work from `dist`.
- [ ] No leftovers:
      `grep -rnE "nestjs-modules/mailer|nodemailer|nestjs-command|connect-flash|ts-node|jest|eslint|__dirname" package.json src test`
      returns nothing.
- [ ] `.env` note in the PR: local `.env` files must set a valid `MAIL_FROM_ADDRESS`; the new
      `STORAGE_*` vars are optional.
- [ ] Delete `upgrade-nestjs/` after the merge, or keep it until the follow-ups in README.md are
      scheduled.
