# NestJS Framework Template — Agent Guide

## Stack

- NestJS + TypeScript
- Sequelize models
- Twig for server-rendered views and email templates
- `@nestjs/event-emitter` for in-process events

## Layout

- Prefer **folder-per-class**: `name/name.kind.ts` (e.g. `web/web.guard.ts`, `user/user.repository.ts`).
- Feature code lives under the owning module (`src/<module>/`). Cross-cutting modules may be `@Global()` (`CommonModule`, `AuthModule`, `TransactionManagerModule`, etc.).
- Prefer matching patterns already in this repo; keep changes focused on the task.

## API vs web controllers

- **API (JSON)** — versioned controllers (`version: ['1']`, global prefix `api/v`), `ResourceConversionInterceptor`, `@ResourceMap`, auth via token guards. Return models/repo results; resources shape the response.
- **Web (HTML)** — Twig views under `views/`, session/flash interceptors from `session-manager`, web auth/redirect flow. Do not apply API resource conversion to web pages.

## Auth (route guards)

Pick the guard that matches the entry point (see `src/auth/guards/`):

- **Web session login** — `WebGuard` (and related web/redirect interceptors)
- **API bearer access token** — `AccessTokenGuard`
- **OAuth password / login token exchange** — `LoginAccessTokenGuard`
- **OAuth refresh** — `RefreshAccessTokenGuard`
- Use `@AuthUser()` for the authenticated user on protected handlers

## Transactions

- For HTTP mutations that need a DB transaction: `@UseInterceptors(TransactionInterceptor)` and `@ReqTransaction() transaction?: Transaction` (`src/transaction-manager/`).
- Pass that `transaction` into repository methods and into `EventRegisterCallbackService.registerEventCallBacks`.
- Outside HTTP (CLI/services), use `TransactionProviderService` managed transactions when needed.

## Events

- Register every event name in `src/system-events/system-events.ts` as a `SystemEvents` enum member. No ad-hoc string event names.
- Prefer namespaced values (e.g. `global.self.health-status`).
- Emit/listen with `SystemEvents` + `EventEmitter2` / `@OnEvent`.
- Cluster IPC: if a command should become an event, map it in `CommandToSystemEvent`.

### Event classes

- Path: `<module>/events/*.event.ts` (e.g. `src/user/events/user-created.event.ts`)
- Class: PascalCase + `Event` (e.g. `UserCreatedEvent`)
- Emit typed payloads; handlers type the payload as that class

### Listeners

- Path: `<module>/listeners/*.listener.ts` (e.g. `user-created.listener.ts`)
- Put `@OnEvent` handlers only in listener classes — not in `*.service.ts`
- Register listeners in the owning module `providers`

### Record-change events

Emit create/update/delete events only via:

1. **Repositories** after a successful write, or
2. **Model lifecycle hooks** scheduling emission with `EventRegisterCallbackService` (`src/common/services/event-register-callback/event-register-callback.service.ts`)

Always pass the Sequelize `transaction` into `registerEventCallBacks` so events run after commit (immediate only when there is no transaction).

## API resources

API controllers must not return raw unshaped models to clients.

- `@UseInterceptors(ResourceConversionInterceptor)` on API controllers
- Resources: `src/resources/api/<version>/<entity>/` (e.g. `v1/user/user.resource.ts`)
- Extend `BaseResource`; expose fields with `@Expose()` (+ `@ApiProperty` as needed)
- Paginated lists: `*-paginated.resource.ts` extending `PaginationResource` (`src/resources/pagination.resource.ts`), with `@Type(() => EntityResource)` on `items`
- Default `@ResourceMap(EntityResource)` on the **controller**; override on the **method** when needed (e.g. paginated index). Method-level wins.
- Controllers return domain/repo results; the interceptor converts via the mapped resource class

## Templates

- Twig only (`.twig`) under `views/` (`layouts/`, `partials/`, `emails/`, feature folders)
- Use `{% extends %}` / `{% include %}` / `{% block %}`
- Render via the view engine / `MailService` with template name + context

## Models

- Place under `src/databases/models/` (domain subfolders allowed, e.g. `oauth/`)
- Extend `BaseModel`; register in `src/databases/model-bootstrap/default-connection-models.ts` (or the correct connection list)

## Repositories

- **Standard:** `*.repository.ts` with a repository class (e.g. `user/user.repository.ts` → `UserRepository`)
- **Legacy:** existing `*-repo.service.ts` / `XxxRepoService` should be renamed to `*.repository.ts` / `XxxRepository` when touched; do not add new `*-repo.service` files
- All database calls go through repositories. Controllers, services, grant types, validators, etc. must not call models / Sequelize / query interfaces directly

## Migrations & CLI

- Migration files: `src/databases/migrations/`
- Run all app commands through: `npm run app:command -- <command> [options]`
- Migration-related commands (implementations under `src/cli-commands/commands/`):
  - `migration:make` — stub
  - `migration:run` — pending
  - `migration:rollback` — roll back
  - `migration:refresh` — drop schema objects and re-run
- Also prefer CLI for create/drop database, seeders, oauth helpers, `route:list` — see that folder for `@Command` names rather than inventing scripts

### Adding CLI commands / seeders

- Add a `@Command` class under `src/cli-commands/commands/` (folder-per-class)
- **Register it** in `src/cli-commands/cli-commands.module.ts` `providers` (file alone is not enough)
- Seeders: extend the seeder base under `src/cli-commands/seeders/`, wire into seeder maps / `SeederService` inputs

## Environment / config

- Group env vars in `src/environment/configs/` and load via `EnvironmentModule`
- Types in `src/environment/environment-types.interface.ts`
- App code uses `ConfigService` (e.g. `getOrThrow<SystemConfig>('system')`), not `process.env`
- `process.env` only in config loaders; any exception in app code needs an explicit justifying comment
