# NestJS Framework Template — Agent Guide

## Stack

* NestJS + TypeScript
* Sequelize models
* Twig for server-rendered views and email templates
* `@nestjs/event-emitter` for in-process events

## Layout

* Prefer **folder-per-class**: `name/name.kind.ts` (e.g. `web/web.guard.ts`, `user/user.service.ts`).
* Feature code lives under the owning module (`src/<module>/`). Cross-cutting modules may be `@Global()` (`CommonModule`, `AuthModule`, `TransactionManagerModule`, `RepositoriesModule`, etc.).
* Prefer matching patterns already in this repo; keep changes focused on the task.

## API vs web controllers

* **API (JSON)** — versioned controllers (`version: ['1']`, global prefix `api/v`), `ResourceConversionInterceptor`, `@ResourceMap`, auth via token guards. Return models/repo results; resources shape the response.
* **Web (HTML)** — Twig views under `views/`, session/flash interceptors from `session-manager`, web auth/redirect flow. Do not apply API resource conversion to web pages.

### API REST controllers

Main resource API controllers should be **RESTful**. Prefer these handler names and HTTP mappings:

| Method   | Path             | Handler              | Behavior                                                        |
| -------- | ---------------- | -------------------- | --------------------------------------------------------------- |
| `GET`    | `/`              | `index`              | Paginated result **or** an array of results                     |
| `POST`   | `/`              | `store`              | Create                                                          |
| `GET`    | `/:entityId`     | `show`               | Single resource                                                 |
| `PUT`    | `/:entityId`     | `update`             | Full replace / update with all fields                           |
| `PATCH`  | `/:entityId/...` | (named action)       | Partial / minor updates; keep the id segment as the path prefix |
| `DELETE` | `/:entityId`     | `destroy` / `remove` | Delete                                                          |

* Route param names must be **meaningful**, not bare `id` (e.g. `userId`, `clientId`).
* Resolve route ids with a **map-to-param pipe** (folder-per-class, e.g. `map-user-to-param/map-user-to-param.pipe.ts`). The pipe calls the repository `findOrFail` and injects the loaded model into the handler, so the controller stays on the **positive flow** (load failures surface as exceptions; handle exceptions only where the use case needs special treatment).

### API controller responsibilities

* Controllers should remain thin and primarily coordinate HTTP concerns: route parameters, DTOs, guards, and invoking the appropriate service/use case.
* Do not put business logic, database queries, or complex data transformations in controllers.
* Services own application/use-case logic.
* Repositories own persistence and database access.
* API resources own response representation.
* Reuse existing project infrastructure rather than implementing endpoint-specific behavior that is already handled globally.

## API DTOs

* **Every API input must use a DTO.** Do not accept arbitrary request objects or inline object types for API request bodies/query parameters when a DTO is appropriate.
* Create DTOs for request inputs such as body, query parameters, and other structured API input.
* **Each request object should have its own DTO class.** Do not reuse a DTO merely because two objects happen to have similar fields if they represent different API concepts.
* DTOs describe the **external API contract**, not database models. Do not use Sequelize models as request DTOs.
* DTOs should contain input validation/declaration appropriate for the project's existing validation infrastructure.
* **Document every DTO property with NestJS Swagger `@ApiProperty` / `@ApiPropertyOptional` as appropriate.** Keep Swagger metadata accurate and synchronized with the actual DTO behavior.
* Required/optional status in Swagger must accurately reflect the DTO validation and API contract.
* Use Swagger helpers to derive DTOs rather than manually duplicating definitions where appropriate.

#### Store / Update DTOs

* Use a dedicated **store/create DTO** for creation inputs.
* Use a dedicated **update DTO** for update inputs.
* If the update request has the **same fields and semantics as the store request**, the update DTO should extend the store DTO rather than duplicating all properties.
* Use NestJS Swagger/mapped-type helpers such as `PartialType`, `PickType`, `OmitType`, or `IntersectionType` as appropriate to accurately add, remove, or change fields.
* When an update DTO differs from the store DTO, explicitly derive it from the appropriate base DTO where practical instead of duplicating fields.
* Do not use `PartialType` when update semantics are not actually equivalent to making the store fields optional.
* Keep Swagger metadata correct after using mapped types; use the appropriate Swagger mapped-type utilities rather than TypeScript-only utility types when API documentation is affected.

Example:

```ts
export class StoreUserDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;
}

export class UpdateUserDto extends PartialType(StoreUserDto) {
  @ApiPropertyOptional()
  @IsOptional()
  name?: string;
}
```

If an update should omit or add fields, use the appropriate Swagger-compatible mapped type instead of duplicating the entire DTO.

## Auth (route guards)

Pick the guard that matches the entry point (see `src/auth/guards/`):

* **Web session login** — `WebGuard` (and related web/redirect interceptors)
* **API bearer access token** — `AccessTokenGuard`
* **OAuth password / login token exchange** — `LoginAccessTokenGuard`
* **OAuth refresh** — `RefreshAccessTokenGuard`
* Use `@AuthUser()` for the authenticated user on protected handlers.

### Authorization

* Authentication establishes who the caller is; it does not automatically establish resource access.
* Resource ownership and permission checks must still be enforced where required.
* Never assume an authenticated user can access an arbitrary resource identified by a route parameter.
* Reuse existing authorization/grant patterns rather than implementing ad-hoc permission checks.

## Transactions

* Sequelize is bound to **cls-hooked** in `src/main.ts` (`Sequelize.useCLS`), so queries inside an active managed transaction join it automatically — do not thread `transaction` through every repository call by default.
* For HTTP mutations that need a DB transaction: `@UseInterceptors(TransactionInterceptor)` (`src/transaction-manager/`). That starts a managed transaction for the request.
* Use `@ReqTransaction()` only when the controller use case itself needs the `Transaction` instance injected (e.g. passing it to `EventRegisterCallbackService.registerEventCallBacks` for after-commit work). Prefer managed CLS behavior otherwise.
* Outside HTTP (CLI/services), use `TransactionProviderService.createManaged` when a transaction is needed.

## Events

* Register every event name in `src/system-events/system-events.ts` as a `SystemEvents` enum member. No ad-hoc string event names.
* Prefer namespaced values (e.g. `global.self.health-status`).
* Emit/listen with `SystemEvents` + `EventEmitter2` / `@OnEvent`.
* Cluster IPC: if a command should become an event, map it in `CommandToSystemEvent`.

### Event classes

* Path: `<module>/events/*.event.ts` (e.g. `src/user/events/user-created.event.ts`)
* Class: PascalCase + `Event` (e.g. `UserCreatedEvent`)
* Emit typed payloads; handlers type the payload as that class.

### Listeners

* Path: `<module>/listeners/*.listener.ts` (e.g. `user-created.listener.ts`)
* Put `@OnEvent` handlers only in listener classes — not in `*.service.ts`.
* Register listeners in the owning module `providers`.

### Record-change events

Emit create/update/delete events only via:

1. **Repositories** after a successful write, or
2. **Model lifecycle hooks** scheduling emission with `EventRegisterCallbackService` (`src/common/services/event-register-callback/event-register-callback.service.ts`).

When after-commit emission is required, pass the Sequelize `Transaction` into `registerEventCallBacks` (obtain via `@ReqTransaction()` in the controller when needed). Without a transaction, callbacks run immediately.

## API resources

API controllers must not return raw unshaped models to clients.

* `@UseInterceptors(ResourceConversionInterceptor)` on API controllers.
* Resources: `src/resources/api/<version>/<entity>/` (e.g. `v1/user/user.resource.ts`).
* Extend `BaseResource`; expose fields with `@Expose()` (+ `@ApiProperty` as needed).
* Paginated lists: `*-paginated.resource.ts` extending `PaginationResource` (`src/resources/pagination.resource.ts`), with `@Type(() => EntityResource)` on `items`.
* Default `@ResourceMap(EntityResource)` on the **controller**; override on the **method** when needed (e.g. paginated index). Method-level wins.
* Controllers return domain/repo results; the interceptor converts via the mapped resource class.
* Do not manually construct API response envelopes when the existing resource/interceptor infrastructure already handles the response shape.
* Do not expose Sequelize/database internals or sensitive fields unless explicitly represented by the API resource.

## API compatibility

* Treat existing API contracts as stable unless the task explicitly requires a breaking change.
* Before modifying an existing endpoint, inspect its DTOs, resources, tests, and related consumers where available.
* Do not unnecessarily rename/remove response fields, change parameter semantics, HTTP methods, or response behavior.
* Prefer backward-compatible changes when possible.
* Use the existing API versioning conventions when an incompatible API contract must be introduced.

## API data access

* All database access must go through repositories.
* Avoid N+1 queries, unbounded collection queries, and loading large datasets into memory.
* Collection endpoints should use the existing pagination, filtering, and query patterns.
* Do not invent endpoint-specific query parameter conventions when an established project convention exists.
* Filtering, sorting, and pagination should be performed at the repository/database layer rather than by loading large datasets into application memory.

## Templates

* Twig only (`.twig`) under `views/` (`layouts/`, `partials/`, `emails/`, feature folders).
* Use `{% extends %}` / `{% include %}` / `{% block %}`.
* Render via the view engine / `MailService` with template name + context.

## Models

* Place under `src/databases/models/` (domain subfolders allowed, e.g. `oauth/`).
* Extend `BaseModel`; register in `src/databases/model-bootstrap/default-connection-models.ts` (or the correct connection list).

## Repositories

* All repositories live under `src/repositories/` (folder-per-class, e.g. `user/user.repository.ts` → `UserRepository`), are registered in `RepositoriesModule`, and **must be exported** from that module.
* A repository may own one or more models that belong to the same flow (e.g. `User` and `UserProfile` in `UserRepository`). Closely related data stays together; separate concerns get their own repository (e.g. user addresses → `UserAddressRepository`).
* A repository may inject another repository to delegate or reuse logic. Prefer **downflow** dependencies (higher-level / aggregating repos depend on more focused ones) so `forwardRef` stays rare.
* **Legacy:** existing `*-repo.service.ts` / `XxxRepoService` should be renamed to `*.repository.ts` / `XxxRepository` when touched; do not add new `*-repo.service` files.
* All database calls go through repositories. Controllers, services, grant types, validators, etc. must not call models / Sequelize / query interfaces directly.

## Migrations & CLI

* Migration files: `src/databases/migrations/`
* Run all app commands through: `npm run app:command -- <command> [options]`
* Migration-related commands (implementations under `src/cli-commands/commands/`):

  * `migration:make` — stub
  * `migration:run` — pending
  * `migration:rollback` — roll back
  * `migration:refresh` — drop schema objects and re-run
* Also prefer CLI for create/drop database, seeders, oauth helpers, `route:list` — see that folder for `@Command` names rather than inventing scripts.

### Adding CLI commands / seeders

* Add a `@Command` class under `src/cli-commands/commands/` (folder-per-class).
* **Register it** in `src/cli-commands/cli-commands.module.ts` `providers` (file alone is not enough).
* Seeders: extend the seeder base under `src/cli-commands/seeders/`, wire into seeder maps / `SeederService` inputs.

## Environment / config

* Group env vars in `src/environment/configs/` and load via `EnvironmentModule`.
* Types in `src/environment/environment-types.interface.ts`.
* App code uses `ConfigService` (e.g. `getOrThrow<SystemConfig>('system')`), not `process.env`.
* `process.env` only in config loaders; any exception in app code needs an explicit justifying comment.

## Testing Strategy

* **Prioritize E2E/API integration tests** for user-facing features, API workflows, authentication/authorization, and database behavior. Prefer testing through the actual NestJS HTTP layer and a real test database where practical.
* Before adding tests, **inspect existing tests and follow the repository's established testing patterns**. Extend existing tests when appropriate rather than creating duplicate coverage.
* Do **not** add unit tests for trivial controllers, CRUD wrappers, repository delegation, DTOs, or NestJS framework wiring.
* Add **unit tests for complex isolated business logic** such as calculations, algorithms, ranking, permissions, transformations, and edge cases.
* When a feature contains both API behavior and complex business logic, use **E2E/integration tests for the workflow + unit tests for the complex logic**.
* Tests should verify **observable behavior rather than implementation details** and avoid unnecessary mocking.
* When fixing a bug, **add a regression test** — preferably E2E/integration if the bug is observable through an API, otherwise a focused unit test.
* **Never change or remove an existing test merely to make a new implementation pass.** If expected behavior has intentionally changed, verify the requirement first and update the test accordingly.
* After making changes, run the **most relevant tests first**, then the broader test suite when practical.
* Do not optimize for test count or coverage percentage; optimize for **regression protection, confidence, and maintainability**.

## API Implementation Workflow

When adding or modifying an API:

1. Inspect similar existing controllers/endpoints and follow their established patterns.
2. Identify the DTO, route parameter pipe, guard, service/use case, repository, resource, and tests involved.
3. Reuse existing infrastructure and conventions rather than creating parallel patterns.
4. Keep the controller thin and put business logic in the appropriate service.
5. Add or update E2E/API integration coverage for significant behavior.
6. Preserve existing API behavior unless the task explicitly requires changing it.
7. Run the relevant tests and verify that existing behavior has not been unintentionally changed.
