# 07 — Mail: `@nestjs-modules/mailer` → `@nestjs/mail`

**Status: done** on branch `feature/upgrade-nestjs`. See "Outcome" at the end.

Docs: https://docs.nestjs.com/application/mail. Reference: wisekeep phase 03 (done).

## Current state

- `MailModule` (global) wraps `MailerModule.forRootAsync({ useClass: MailConfigService })`.
- `MailConfigService` picks the transport from `MAIL_DRIVER` and reads `MAIL_SMTP_*` through raw
  `ConfigService.get('KEY')`. It uses `import MailMessage = require('nodemailer/...')`, which
  blocks ESM.
- `MailService.sendMail(ISendMailOptions)` renders `views/<template>.twig` itself, then calls the
  mailer. It deep-imports `@nestjs-modules/mailer/dist/...`.
- `src/environment/configs/mail.ts` points `template.dir` at a stale
  `dist/view-engine/views/emails` path.
- Template: `views/emails/welcome.twig`.

## Package facts

- `@nestjs/mail@0.0.2`, peer `@nestjs/common` / `@nestjs/core` `^11 || ^12`. It has its own SMTP
  client on `node:net` / `node:tls`, so **no nodemailer**.
- `MailModule.forRoot` / `forRootAsync({ useClass | useFactory })` with a `MailOptionsFactory`. It is
  global and provides `Mailer`, `MailEvents`, `MailTransport` and `MailTemplateEngine`.
- Transports: `SmtpTransport`, `LogMailTransport`, `FileMailTransport`, `InMemoryMailTransport`
  (tests), plus Resend / Postmark / SendGrid / SES over `fetch`.
- Built-in in-process `retry` (3 attempts with backoff by default). An invalid `from` fails at boot.
- Custom template engine: extend `MailTemplateEngine` and implement
  `render(name, context, { locale })`, returning `html` or `{ html, text }`.
- `Mailable<TData>` classes: `render(data, ctx)` → `{ subject, template, context, attachments }`.
  `mailer.send(MailClass, { to, data })`; `mailer.render(...)` builds a message without sending.

## Target layout

```
src/mail/
  mail.module.ts                                                MailModule.forRootAsync (wrapped, global)
  services/mail-config/mail-config.service.ts                   MailOptionsFactory: transport, from, templates, retry
  services/mail/mail.service.ts                                 facade: send(MailClass, { to, data }), render(...)
  template-engines/twig-template-engine/twig-template-engine.ts MailTemplateEngine → VIEW_RENDER_ENGINE (Twig)
  mailables/welcome/welcome.mail.ts
```

## Tasks

- [x] `npm i @nestjs/mail@0.0.2 --save-exact`. Then `npm rm @nestjs-modules/mailer nodemailer @types/nodemailer`.
- [x] Fallout check: packages that were only installed transitively through the mailer (wisekeep:
      `uuid`, `express`, `jsonwebtoken`). Declare the ones that are imported directly, or replace
      `uuid` with `crypto.randomUUID()`.
- [x] **Config** (`src/environment/configs/mail.ts`, `MailConfig` in `environment-types.interface.ts`):
  - [x] shape: `{ driver: 'smtp' | 'log' | 'memory', from: { name, address }, retry, smtp: { host, port, secure, startTls, auth } }`;
  - [x] read every `MAIL_*` value in the loader, so nothing reads raw keys through `ConfigService`;
  - [x] the default sender becomes `noreply@example.com`, because `noreply@nesttemplate` **fails
        boot validation**. Read `MAIL_FROM_ADDRESS` (documented in `.env.example`), with a fallback
        to `MAIL_FROM_EMAIL` (what the code reads today);
  - [x] drop `template.dir`, `options.partials` and `inlineCssOptions`;
  - [x] update `.env.example` (`MAIL_DRIVER=log` as the documented default, plus `MAIL_RETRY`).
- [x] **Transport mapping** in `MailConfigService`:

  | `MAIL_DRIVER` | Transport                         | Use              |
  | ------------- | --------------------------------- | ---------------- |
  | `smtp`        | `SmtpTransport({ ...smtp })`      | production       |
  | `log`         | `LogMailTransport({ body: true })` | local (default) |
  | `memory`      | `InMemoryMailTransport()`         | e2e              |

  Make the default explicit in the config, not a `switch` fallthrough.
- [x] **`TwigTemplateEngine`** extends `MailTemplateEngine`. It renders
      `views/<name>.twig` through the existing `VIEW_RENDER_ENGINE` provider, so template functions
      such as `url()` work in mail. Provide a text part only if a `<name>.txt.twig` exists;
      otherwise let `@nestjs/mail` derive it.
- [x] **Mailables**: `WelcomeMail implements Mailable<{ user }>` →
      `{ subject, template: 'emails/welcome', context }`. One class per email.
- [x] **`MailService` facade**: `send(MailClass, { to, data, idempotencyKey? })` returns the
      `send()` result; `render(...)` is for previews. It does not catch errors; callers can read
      `MailError.permanent`.
- [x] **After-commit sending**: when a mail must go out only after a DB commit, send it from a
      listener scheduled through `EventRegisterCallbackService.registerEventCallBacks(transaction)`
      (AGENTS.md pattern). No `@nestjs/outbox`.
- [-] Optional (not done; nothing sends mail yet): `src/mail/listeners/mail-events.listener.ts` subscribes to `MailEvents.events$` and
      logs sent/failed without the body.
- [x] **Tests**:
  - [x] delete `mail-config.service.spec.ts` and `mail.service.spec.ts` (they test framework wiring
        of the old mailer, which AGENTS.md says not to unit test);
  - [x] add `test/mail/mail.e2e-spec.ts`: send `WelcomeMail` through the real module and assert on
        the `InMemoryMailTransport` (`assertSent({ to, subject })`, plus a rendered-HTML snippet from
        the Twig template);
  - [x] in `basicE2eSetup`, rely on `MAIL_DRIVER=memory` from `test/e2e-env.ts`, or
        `.overrideProvider(MailTransport).useValue(new InMemoryMailTransport())`, and expose it to
        suites through a helper.
- [-] Coverage excludes: paths unchanged (`src/mail/services/mail-config/**` still excluded).
- [-] AGENTS.md "Templates" (in phase 09 with the other AGENTS.md updates): mail is sent via Mailable classes + `MailService.send`, and templates
      stay Twig under `views/emails/`.

## Check

- `MAIL_DRIVER=log`: a tinker call to `mailService.send(WelcomeMail, …)` prints the rendered message.
- `MAIL_DRIVER=smtp` against Mailpit on `localhost:1025` delivers with the right `from`, subject and
  HTML.
- `grep -rn "nestjs-modules/mailer\|nodemailer" src test package.json` returns nothing.

## Outcome (2026-11-24)

- `@nestjs/mail@0.0.2` pinned exactly. It ships its own SMTP client, so `@nestjs-modules/mailer`,
  `nodemailer` and `@types/nodemailer` were removed.
- Layout as planned: `MailConfigService` (`MailOptionsFactory`: `smtp` → `SmtpTransport`,
  `log` → `LogMailTransport({ body: true })`, `memory` → `InMemoryMailTransport`), `MailService`
  (thin facade over `Mailer.send` / `Mailer.render`), `TwigTemplateEngine` (extends
  `MailTemplateEngine`, renders `views/<name>.twig` through the app's `VIEW_RENDER_ENGINE`, so
  `url()` and the other template functions work in mail) and one sample Mailable, `WelcomeMail`.
- **Config:** every `MAIL_*` value is read in `src/environment/configs/mail.ts`; the raw
  `configService.get('MAIL_SMTP_HOST')` reads are gone. `MAIL_FROM_ADDRESS` (documented) falls back
  to `MAIL_FROM_EMAIL` (what the old code read). New `MAIL_RETRY` (default 3). An unknown driver
  falls back to `log`. The stale `dist/view-engine/views/emails` template path is gone.
- `views/emails/welcome.twig` gained a `{{ url('/') }}` link, as a sample of template functions in
  mail.
- **Dependency fallout:** `moment` (used at runtime by the OAuth controller and refresh-token
  service) and `express` were only installed transitively; both are now declared.
- **Breaking for local `.env` files:** `@nestjs/mail` validates the sender at boot, and
  `noreply@nesttemplate` (no TLD) **stops the app from starting**
  (`MailMessageError: from.address has an invalid domain`). `.env.example` now uses
  `noreply@example.com`, defaults `MAIL_DRIVER=log`, and documents every mail variable. Local
  `.env` files must set a valid `MAIL_FROM_ADDRESS`.
- The misleading boot line `ERROR [ExceptionsHandler] Transporter is ready` (from the old
  hand-written log transport) is gone.

| Check | Result |
| ----- | ------ |
| `test/mail/mail.e2e-spec.ts` | ✅ 4 tests: in-memory transport, Twig render + configured sender, `url()` in mail, derived text part |
| Old wiring specs | deleted (`mail-config.service.spec.ts`, `mail.service.spec.ts`; they tested `@nestjs-modules/mailer` wiring) |
| `MAIL_DRIVER=log` via `tinker` | ✅ prints subject, recipient and body (with the app link) |
| `MAIL_DRIVER=smtp` against a throwaway Mailpit container | ✅ delivered; correct from/to/subject, HTML body and a text part |
| Boot with the old sender | ❌ refused, as expected → `.env.example` fixed |
| Unit + e2e / lint / typecheck (app) / format | ✅ 276 tests / 0 errors / 0 / clean |
| `grep -rn "nestjs-modules/mailer\|nodemailer" src test package.json` | empty |
