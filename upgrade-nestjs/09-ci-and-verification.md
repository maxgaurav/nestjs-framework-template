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

## Fixes before final verification

- [ ] **Redirect loop on failed web GETs** (pre-existing, found in phase 03). A browser
      `GET /oauth/authorization` with missing or invalid parameters and no `Referer` redirects to
      itself until the browser gives up: `SessionMapPreviousUrlInterceptor` records the current GET
      URL as `_previous.url` before the validation pipe runs, and `ErrorValidationFormatFilter`
      then redirects the failed GET back to that same URL. Port wisekeep's fix:
  - [ ] web **GET** requests that fail validation render `views/errors/invalid-request.twig`
        (422) instead of redirecting. Form **POST**s keep flash-and-redirect-back; JSON is unchanged;
  - [ ] `AuthorizationRequestErrorFilter` on `GET /oauth/authorization` renders
        `views/authorization/invalid-request.twig` listing every problem, status 400, and never
        redirects (RFC 6749 §4.1.2.1: do not redirect to an unverified client);
  - [ ] `ClientIdExistsValidator` only queries well-formed UUIDs; `@IsUUID` reports the rest.
        Otherwise Postgres rejects the raw value and the request ends in a 500;
  - [ ] e2e (`test/auth/authorization.e2e-spec.ts`): no `Location` header for a failed web GET,
        missing params, non-UUID client (500 before), unknown client, every problem listed, JSON
        422, valid request shows the login page; `curl -L` follows 0 redirects.

- [ ] **No sessions on API routes, unless a route opts in to cookie authentication.**
      Today `express-session` and the flash middleware run for every request, so API and token
      requests load (and can create) sessions, and `KillForApiInterceptor` then
      `session.destroy()`s the session after any request whose URL merely *contains* `api`,
      `oauth/token` or `oauth/refresh`. That logs a browser user out of the web app as soon as it
      calls an API route with its cookie, and the substring match also hits unrelated paths.
  - [ ] **Stateless by default.** Mount the session (and flash) middleware through a
        `SessionMiddleware` in `SessionManagerModule` with `MiddlewareConsumer`, **excluding** the
        stateless routes: `api/v{*splat}` (all versioned API controllers), `oauth/token`,
        `oauth/refresh`, `health`, `files/{*splat}`, `storage/{*splat}`. No session is read,
        created or cookie set for them. Remove `app.use(session)` / `app.use(flashMiddleware())`
        from `main.ts` and the e2e setup.
  - [ ] **Opt-in for cookie-based authentication** (the special case, e.g. a same-origin SPA
        calling the API with the web session): a `@UseSession()` decorator for API controllers or
        handlers. `SessionManagerModule` discovers the decorated routes (`DiscoveryService` +
        `Reflector`) at startup and applies the same middleware to exactly those routes
        (`consumer.apply(...).forRoutes(...)`). A matching guard (`WebGuard` or a dedicated
        `SessionAuthGuard`) authenticates from the session; CSRF protection is required for
        state-changing cookie-authenticated routes (`SameSite=Lax` cookie at minimum, plus a
        CSRF token or `Origin` check for non-GET).
  - [ ] **Delete `KillForApiInterceptor`** (and its registration in `main.ts`, the e2e setup and
        `SessionManagerModule`): with no session on API routes there is nothing to kill, and
        destroying sessions is what logs web users out.
  - [ ] Session-dependent code tolerates a missing `req.session` on stateless routes:
        `SessionMapPreviousUrlInterceptor`, `SetupIntendInterceptor`, `RedirectFromLoginFilter`,
        `ErrorValidationFormatFilter` (flash only for web requests), the `session()` template
        function and the redirect-route interceptor. Guard with `if (!req.session) return next()`
        rather than creating a session.
  - [ ] Config: keep `saveUninitialized: false` as the default (no cookie until something is
        stored), set the cookie `sameSite: 'lax'` and `httpOnly: true` explicitly.
  - [ ] e2e (`test/session/api-session.e2e-spec.ts`):
    - [ ] `POST /oauth/token` and an `/api/v1/...` route respond **without `Set-Cookie`**, and the
          session store holds no new session afterwards;
    - [ ] a web route (`GET /oauth/authorization/...` login page) still sets the session cookie,
          and flash + redirect-to-login keep working;
    - [ ] **regression:** a browser session cookie sent to an API route is ignored and **not
          destroyed**: the same cookie still works on a web route afterwards (fails today);
    - [ ] a test-only `@UseSession()` API route reads the web session (opt-in works) and
          rejects a cross-site state-changing request.
  - [ ] AGENTS.md "API vs web controllers": API routes are stateless; cookie authentication on an
        API route requires `@UseSession()` + its guard + CSRF protection.

## AGENTS.md updates

- [ ] **Stack**: Nest 12, native ESM (`.js` import extensions, `import.meta.dirname`), Node 26.
- [ ] **Build/run**: `npm run build` (tsgo), `typecheck`, `start:dev`; `app:command` compiles and
      then runs `dist/cli.js`.
- [x] **CLI commands** (done in phase 03): `nest-commander` (`@Command` + `CommandRunner`, `@Option`), thin command +
      service, registration in `CliCommandsModule`.
- [ ] **Lint/format**: oxlint (`npm run lint`), prettier (`format`, `format:check`).
- [ ] **Testing**: Vitest (`npm test`, `npm run test:e2e`), `basicE2eSetup` +
      `managedTransaction` (one rolled-back transaction per test, joined via cls-hooked), and the
      in-memory mail/storage overrides.
- [ ] **Mail**: Mailable classes + `MailService.send`, Twig templates in `views/emails/` (also update the AGENTS.md "Templates" section, deferred from phase 07).
- [ ] **Storage**: `@nestjs/storage` disks (`StorageDisks` constants, `@InjectDisk`),
      `StorageErrorFilter`, and uploads validated by `nestjs-form-data` DTOs and persisted through
      `FileStorageService`.
- [x] **TypeScript strictness** (done in phase 10): the phase 10 rules (`declare` on model columns, `!` on DTO and
      resource fields, `satisfies` in config loaders).
- [ ] **Models**: ESM circular-import rule (the `Relation<T>` alias on association properties), and
      registration in `DefaultConnectionModels` is required (there is no glob any more).
- [x] **Migrations**: ESM migration shape (done in phase 04, AGENTS.md "ES modules").

## Project README

- [ ] Replace the stock Nest README with template docs: setup, `npm run` scripts (build is tsgo,
      `app:command`, `tinker`, `test`, `test:e2e`), and an editor note: the IDE uses TS 6 from
      `node_modules` (same tsconfig); the VS Code "TypeScript (Native Preview)" extension gives TS 7.

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
