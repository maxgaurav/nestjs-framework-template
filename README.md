# NestJS Framework Template

A NestJS 12 application template: versioned JSON API with OAuth 2 (password, authorization code,
PKCE, refresh), server-rendered Twig pages for the web login flow, Sequelize on PostgreSQL, mail,
file storage, a CLI, and an end-to-end test setup with one rolled-back transaction per test.

## Stack

| Area                     | Choice                                                                    |
| ------------------------ | ------------------------------------------------------------------------- |
| Runtime                  | Node.js 26 (`.nvmrc`), native ES modules                                  |
| Framework                | NestJS 12 (Express 5)                                                     |
| Language                 | TypeScript, fully strict; built with TypeScript 7 (`tsgo`)                |
| Database                 | PostgreSQL via Sequelize / `sequelize-typescript`, CLS-bound transactions |
| Views and mail templates | Twig 3                                                                    |
| Mail                     | `@nestjs/mail` (SMTP, log, in-memory transports)                          |
| File storage             | `@nestjs/storage` (local folders or any S3-compatible bucket)             |
| CLI                      | `nest-commander`                                                          |
| Tests                    | Vitest (unit + e2e against a real database)                               |
| Lint / format            | oxlint (type-aware) / Prettier                                            |

## Getting started

```bash
nvm use                                        # Node 26
npm ci
cp .env.example .env                           # then set the DB_* values
npm run app:command -- app:generate-secret     # APP_SECRET (required at boot)
npm run app:command -- oauth:generate-keys     # RS256 key pair for bearer tokens (required at boot)
npm run app:command -- database:create
npm run app:command -- migration:run
npm run start:dev
```

The app listens on `APP_PORT` (default 3000). API documentation: `/api-documentation/v1`.
Health: `/health`.

Create an OAuth client for your app:

```bash
npm run app:command -- oauth:generate-client "My SPA" pkce
```

## Scripts

| Script                             | What it does                                               |
| ---------------------------------- | ---------------------------------------------------------- |
| `npm run build`                    | Compile to `dist/` with TypeScript 7 (well under a second) |
| `npm run start:dev`                | Compile in watch mode and restart the app on change        |
| `npm run start:prod`               | Run the compiled app (`dist/main.js`)                      |
| `npm run typecheck`                | Type-check `src` and `test`                                |
| `npm run lint` / `lint:fix`        | oxlint                                                     |
| `npm run format` / `format:check`  | Prettier                                                   |
| `npm test`                         | Unit tests                                                 |
| `npm run test:e2e`                 | E2E tests (needs the database from `.env`)                 |
| `npm run test:cov`                 | Unit tests with coverage                                   |
| `npm run app:command -- <command>` | Compile, then run a CLI command                            |
| `npm run tinker`                   | REPL with every provider (`await get(MailService)…`)       |

## CLI commands

Run with `npm run app:command -- <command>`; `--help` lists them all.

| Command                                                                 | Purpose                                                                                                                |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `app:generate-secret [--show] [--force]`                                | Generate `APP_SECRET` into the env file. Replacing one logs out every session and invalidates values encrypted with it |
| `oauth:generate-keys [--force]`                                         | Generate the RS256 key pair in `storage/`. Replacing it invalidates every issued token                                 |
| `oauth:generate-client <name> <grantType>`                              | Create an OAuth client (`password`, `authorization-code`, `pkce`)                                                      |
| `database:create` / `database:drop`                                     | Create or drop the configured database                                                                                 |
| `migration:make <name>`                                                 | Create a migration in `src/databases/migrations/`                                                                      |
| `migration:run` / `migration:rollback [--till N]` / `migration:refresh` | Apply, roll back or re-run migrations                                                                                  |
| `migration:status`                                                      | List migrations as up, pending or missing                                                                              |
| `route:list`                                                            | Print the registered HTTP routes                                                                                       |
| `seeder:seed --all`                                                     | Run the seeders                                                                                                        |

## Configuration

All settings come from environment variables, documented in [`.env.example`](./.env.example) and
loaded by `src/environment/configs/`. Required: `APP_SECRET` and the JWT keys in `storage/`
(both generated by the commands above), and a valid `MAIL_FROM_ADDRESS`. Set `OVERRIDE_ENV=x` to
load `.env.x` instead of `.env`.

## Project conventions

[`AGENTS.md`](./AGENTS.md) is the working guide for this codebase (for people and coding agents):
layout, API vs web controllers, DTOs, auth, transactions, events, mail, storage, CLI, strict
TypeScript rules and the testing strategy.

## Editor setup

- The IDE uses TypeScript 6 from `node_modules` (same `tsconfig.json`). For TypeScript 7 in VS Code,
  install the "TypeScript (Native Preview)" extension.
- Linting: install the oxc extension for oxlint; formatting: Prettier.

## License

UNLICENSED (private template).
