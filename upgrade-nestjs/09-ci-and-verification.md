# 09 — CI, AGENTS.md, final verification

**Status: not started**

## CI (`.github/workflows/node.js.yml`)

- [x] Node `26.x` (from `.nvmrc`), `npm ci` (not `npm install`), and **re-enable tests**:

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

- [x] An `e2e` job with a `postgres:17` service container that runs `oauth:generate-keys`,
      `npm run app:command -- migration:run`, then `npm run test:e2e`.

**CI outcome:** both jobs were reproduced locally in a clean worktree (no `.env`, fresh
PostgreSQL container, the workflow's env vars): all steps pass, e2e 43/43. The first reproduction
failed 3 tests that passed locally, which exposed two real bugs, both fixed in `331ec31`:

- **JWT signing was broken or meaningless.** Tokens were signed `HS256` with the private key file
  as an HMAC secret. With generated RSA keys (CI, production) refresh failed with a 500; with the
  empty key files the app created when keys were missing (every local checkout here), signatures
  proved nothing. Now RS256 with the key pair, RS256-only verification, and missing/empty keys stop
  the app at boot. `oauth:generate-keys` writes an unencrypted PKCS#8 key with mode 600, never logs
  keys, refuses to overwrite without `--force`, and runs standalone.
- **Separate session stores.** Every `SessionConfigService.session()` call created a new
  `MemoryStore`, so `@UseSession()` routes never saw the web session with `SESSION_DRIVER=memory`.
  The handler is now shared; e2e runs on the memory store, like CI.

## Fixes before final verification

- [x] **Redirect loop on failed web GETs** (pre-existing, found in phase 03). A browser
      `GET /oauth/authorization` with missing or invalid parameters and no `Referer` redirects to
      itself until the browser gives up: `SessionMapPreviousUrlInterceptor` records the current GET
      URL as `_previous.url` before the validation pipe runs, and `ErrorValidationFormatFilter`
      then redirects the failed GET back to that same URL. Port wisekeep's fix:
  - [x] web **GET** requests that fail validation render `views/errors/invalid-request.twig`
        (422) instead of redirecting. Form **POST**s keep flash-and-redirect-back; JSON is unchanged;
  - [x] `AuthorizationRequestErrorFilter` on `GET /oauth/authorization` renders
        `views/authorization/invalid-request.twig` listing every problem, status 400, and never
        redirects (RFC 6749 §4.1.2.1: do not redirect to an unverified client);
  - [x] `ClientIdExistsValidator` only queries well-formed UUIDs; `@IsUUID` reports the rest.
        Otherwise Postgres rejects the raw value and the request ends in a 500;
  - [x] e2e (`test/auth/authorization.e2e-spec.ts`): no `Location` header for a failed web GET,
        missing params, non-UUID client (500 before), unknown client, every problem listed, JSON
        422, valid request shows the login page; `curl -L` follows 0 redirects.
  - [x] **Outcome:** the e2e tests were written first and reproduced all three bugs here (302 loop
        for missing parameters and an unknown client, 500 for a non-UUID client). After the port:
        5/5 e2e, unit cases for the filter branches (failed GET renders, POST flashes and
        redirects, no session → JSON) and the validator's UUID skip. Against the built app,
        `curl -L` follows 0 redirects and gets the 400 page. The validator spec used `'123'` as a
        client id; its lookup cases now use a real UUID.

- [x] **No sessions on API routes, unless a route opts in to cookie authentication.**
      Today `express-session` and the flash middleware run for every request, so API and token
      requests load (and can create) sessions, and `KillForApiInterceptor` then
      `session.destroy()`s the session after any request whose URL merely *contains* `api`,
      `oauth/token` or `oauth/refresh`. That logs a browser user out of the web app as soon as it
      calls an API route with its cookie, and the substring match also hits unrelated paths.
  - [x] **Stateless by default.** Mount the session (and flash) middleware through a
        `SessionMiddleware` in `SessionManagerModule` with `MiddlewareConsumer`, **excluding** the
        stateless routes: `api/v{*splat}` (all versioned API controllers), `oauth/token`,
        `oauth/refresh`, `health`, `files/{*splat}`, `storage/{*splat}`. No session is read,
        created or cookie set for them. Remove `app.use(session)` / `app.use(flashMiddleware())`
        from `main.ts` and the e2e setup.
  - [x] **Opt-in for cookie-based authentication** (the special case, e.g. a same-origin SPA
        calling the API with the web session): a `@UseSession()` decorator for API controllers or
        handlers. `SessionManagerModule` discovers the decorated routes (`DiscoveryService` +
        `Reflector`) at startup and applies the same middleware to exactly those routes
        (`consumer.apply(...).forRoutes(...)`). **Implemented per controller** (class decorator):
        keep cookie-authenticated endpoints in their own controller. A matching guard (`WebGuard` or a dedicated
        `SessionAuthGuard`) authenticates from the session; CSRF protection is required for
        state-changing cookie-authenticated routes (`SameSite=Lax` cookie at minimum, plus a
        CSRF token or `Origin` check for non-GET).
  - [x] **Delete `KillForApiInterceptor`** (and its registration in `main.ts`, the e2e setup and
        `SessionManagerModule`): with no session on API routes there is nothing to kill, and
        destroying sessions is what logs web users out.
  - [x] Session-dependent code tolerates a missing `req.session` on stateless routes:
        `SessionMapPreviousUrlInterceptor`, `SetupIntendInterceptor`, `RedirectFromLoginFilter`,
        `ErrorValidationFormatFilter` (flash only for web requests), the `session()` template
        function and the redirect-route interceptor. Guard with `if (!req.session) return next()`
        rather than creating a session.
  - [x] Config: keep `saveUninitialized: false` as the default (no cookie until something is
        stored), set the cookie `sameSite: 'lax'` and `httpOnly: true` explicitly.
  - [x] e2e (`test/session/api-session.e2e-spec.ts`):
    - [x] `POST /oauth/token` and an `/api/v1/...` route respond **without `Set-Cookie`**, and the
          session store holds no new session afterwards;
    - [x] a web route (`GET /oauth/authorization/...` login page) still sets the session cookie,
          and flash + redirect-to-login keep working;
    - [x] **regression:** a browser session cookie sent to an API route is ignored and **not
          destroyed**: the same cookie still works on a web route afterwards (fails today);
    - [x] a test-only `@UseSession()` API route reads the web session (opt-in works) and
          rejects a cross-site state-changing request.
  - [x] AGENTS.md "API vs web controllers": API routes are stateless; cookie authentication on an
        API route requires `@UseSession()` + its guard + CSRF protection.
  - [x] **Outcome:** e2e `test/session/api-session.e2e-spec.ts` (8 tests) with a test-only probe
        module. Run against the previous commit, the "no session on API routes" and "does not
        destroy a web session" tests both fail; they pass now. Boot check: `/health` and
        `/oauth/token` set no cookie; the web login form still flashes and redirects; the cookie is
        `HttpOnly; SameSite=Lax`. Found on the way: `SetupIntendInterceptor` skipped a route that
        does not exist (`oauth/login`); URL matching is gone from all session code.

- [x] **Refresh tokens as a grant type on the token endpoint (RFC 6749 §6).** Today refresh is a
      separate `POST /oauth/refresh` with its own DTO, guard (`RefreshAccessTokenGuard`) and
      strategy. Standard OAuth 2 clients send `grant_type=refresh_token` to the token endpoint.
  - [x] Add `RefreshTokenGrantType` next to the password / authorization-code / PKCE grant types
        and register it in `GrantTypeMappings` for `GrantTypes.RefreshToken = 'refresh_token'`.
        It validates `refresh_token`, `client_id`, `client_secret` (active client only, as fixed
        for the other grants), checks that the refresh token belongs to that client and is not
        expired, and **rotates** it (`consumeToken`: old refresh + access token revoked, new pair
        issued) inside the request transaction.
  - [x] `AccessTokenDto` gets `refresh_token` (required only for that grant, `@ValidateIf`), with
        accurate `@ApiProperty` docs; Swagger documents the grant on `POST /oauth/token`.
  - [x] Response: the same `BearerTokenResponse` as the other grants (and `201`, matching today's
        token endpoint). Errors follow RFC 6749 §5.2 where the project's 422 format allows
        (`invalid_grant` for an unknown, expired or foreign refresh token).
  - [x] **API compatibility (decided: remove).** `POST /oauth/refresh` is an existing contract. Keep it as a thin,
        `@ApiOperation({ deprecated: true })` alias that delegates to the same grant for one
        release, or remove it outright if no client depends on it (the project owner decides;
        template default: deprecate first). Then delete `RefreshAccessTokenGuard`,
        `RefreshTokenService` (strategy) and `RefreshTokenDto` when the alias goes.
  - [x] `oauth/refresh` removed from `STATELESS_ROUTES` (no alias).
  - [x] e2e: refresh via `grant_type=refresh_token` issues a new pair; the old refresh token is
        rejected afterwards (rotation); a refresh token used with another client is rejected; a
        revoked client is rejected; `POST /oauth/refresh` now returns 404.
        Existing `oauth-token.e2e-spec.ts` refresh cases move to the grant.
  - [x] **Outcome:** the project owner chose to remove the endpoint outright. 9 e2e tests for the
        grant (16 in `oauth-token.e2e-spec.ts`). Removed: the `/oauth/refresh` handler,
        `RefreshAccessTokenGuard`, the `RefreshTokenService` strategy, `RefreshTokenDto` and their
        specs. OpenAPI now has only `POST /oauth/token`, with `refresh_token` in the grant enum.
        Found on the way:
    - **Bug:** `consumeToken` swapped the lifetimes (new access token got the 60-day refresh
          lifetime, the new refresh token 30 days). The lifetime test fails with the swap put back.
    - **Bug:** a refresh token could be redeemed with any client's credentials; it is now bound
          to the client it was issued to.
    - A malformed refresh token is a 422, not a 500.
    - **Bug:** `LoggingService` logged every `Error` as `{}` (JSON of an object with no enumerable
          fields), hiding every unhandled exception's cause; it now logs the stack.

## New CLI commands

- [x] **`app:generate-secret`**: generate a new `APP_SECRET` (cryptographically random, 64 hex
      characters from `crypto.randomBytes(32)`) and write it to `.env`. The `app:` namespace marks
      an app-level configuration change; "generate" says it creates a new value (cf. the existing
      `oauth:generate-keys` / `oauth:generate-client`).
  - [x] `--show`: print the secret only, change nothing (for secret managers / CI variables).
  - [x] Refuses to replace an existing non-empty `APP_SECRET` unless `--force` is given, and then
        prints what rotation breaks: **all sessions** are logged out, values encrypted with
        `HashEncryptService` can no longer be decrypted, and storage signing keys derived from
        `APP_SECRET` (when `STORAGE_SIGNING_KEYS` is empty) change, so outstanding signed links stop
        working.
  - [x] Writes the env file the app loads (`.env`, or `.env.<OVERRIDE_ENV>`), creating the key if
        it is missing and keeping every other line, comment and the file mode unchanged.
  - [x] Must run **without** a valid `APP_SECRET` (it creates the first one), so it cannot boot
        the full app: `cli.ts` routes it to `StandaloneCommandsModule` (no config, no DB) before
        `HttpCommandFactory`. It is also registered in `CliCommandsModule` so `--help` lists it.
  - [x] Unit test on a temp env file: adds the key, refuses without `--force`, replaces with
        `--force`, preserves other lines, `--show` writes nothing.
- [x] **`migration:status`**: list every migration with its state, e.g.

  ```
  up       20210822104600-AddUUIDExtension.ts
  up       20210822104619-CreateUsersTable.ts
  pending  20261124120000-AddAvatarToUsers.ts
  2 up, 1 pending
  ```

  - [x] Uses `MigratorFactoryService` (`umzug.executed()` / `umzug.pending()`), so names match
        `SequelizeMeta` from `src` or `dist`.
  - [x] Also flags migrations recorded in `SequelizeMeta` whose file no longer exists
        (`missing`), which `migration:rollback` cannot undo.
  - [x] Read-only; exit code 0. Unit test of the state/format logic; verified against the real
        DB (`6 up, 0 pending`, and `pending` for a freshly generated migration).
  - [x] **Found while testing:** the migration stub did not compile after phase 10
        (`noUnusedParameters` / `noUnusedLocals`) and an empty `async` step failed `require-await`,
        so `migration:make` broke the next build. The stub now uses `_queryInterface` and drops the
        unused import; `require-await` is off for `src/databases/migrations/**`. A generated stub
        passes typecheck, lint and Prettier.
- [x] AGENTS.md "Migrations & CLI": list both commands.

## AGENTS.md updates

- [x] **Stack**: Nest 12, native ESM (`.js` import extensions, `import.meta.dirname`), Node 26.
- [x] **Build/run**: `npm run build` (tsgo), `typecheck`, `start:dev`; `app:command` compiles and
      then runs `dist/cli.js`.
- [x] **CLI commands** (done in phase 03): `nest-commander` (`@Command` + `CommandRunner`, `@Option`), thin command +
      service, registration in `CliCommandsModule`.
- [x] **Lint/format**: oxlint (`npm run lint`), prettier (`format`, `format:check`).
- [x] **Testing**: Vitest (`npm test`, `npm run test:e2e`), `basicE2eSetup` +
      `managedTransaction` (one rolled-back transaction per test, joined via cls-hooked), and the
      in-memory mail/storage overrides.
- [x] **Mail**: Mailable classes + `MailService.send`, Twig templates in `views/emails/` (also update the AGENTS.md "Templates" section, deferred from phase 07).
- [x] **Storage**: `@nestjs/storage` disks (`StorageDisks` constants, `@InjectDisk`),
      `StorageErrorFilter`, and uploads validated by `nestjs-form-data` DTOs and persisted through
      `FileStorageService`.
- [x] **TypeScript strictness** (done in phase 10): the phase 10 rules (`declare` on model columns, `!` on DTO and
      resource fields, `satisfies` in config loaders).
- [x] **Models**: ESM circular-import rule (the `Relation<T>` alias on association properties), and
      registration in `DefaultConnectionModels` is required (there is no glob any more).
- [x] **Migrations**: ESM migration shape (done in phase 04, AGENTS.md "ES modules").

## Project README

- [x] Replace the stock Nest README with template docs: setup, `npm run` scripts (build is tsgo,
      `app:command`, `tinker`, `test`, `test:e2e`), and an editor note: the IDE uses TS 6 from
      `node_modules` (same tsconfig); the VS Code "TypeScript (Native Preview)" extension gives TS 7.

- [x] **Lint includes formatting** (requested): `npm run lint` = `lint:code` (oxlint) +
      `format:check` (Prettier), like the old ESLint + `eslint-plugin-prettier` setup;
      `lint:fix` runs both fixers. CI runs `npm run lint` only.

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
