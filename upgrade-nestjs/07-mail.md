# 07 — Mail: `@nestjs-modules/mailer` → `@nestjs/mail`

**Status: not started**

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

- [ ] `npm i @nestjs/mail@0.0.2 --save-exact`. Then `npm rm @nestjs-modules/mailer nodemailer @types/nodemailer`.
- [ ] Fallout check: packages that were only installed transitively through the mailer (wisekeep:
      `uuid`, `express`, `jsonwebtoken`). Declare the ones that are imported directly, or replace
      `uuid` with `crypto.randomUUID()`.
- [ ] **Config** (`src/environment/configs/mail.ts`, `MailConfig` in `environment-types.interface.ts`):
  - [ ] shape: `{ driver: 'smtp' | 'log' | 'memory', from: { name, address }, retry, smtp: { host, port, secure, startTls, auth } }`;
  - [ ] read every `MAIL_*` value in the loader, so nothing reads raw keys through `ConfigService`;
  - [ ] the default sender becomes `noreply@example.com`, because `noreply@nesttemplate` **fails
        boot validation**. Read `MAIL_FROM_ADDRESS` (documented in `.env.example`), with a fallback
        to `MAIL_FROM_EMAIL` (what the code reads today);
  - [ ] drop `template.dir`, `options.partials` and `inlineCssOptions`;
  - [ ] update `.env.example` (`MAIL_DRIVER=log` as the documented default, plus `MAIL_RETRY`).
- [ ] **Transport mapping** in `MailConfigService`:

  | `MAIL_DRIVER` | Transport                         | Use              |
  | ------------- | --------------------------------- | ---------------- |
  | `smtp`        | `SmtpTransport({ ...smtp })`      | production       |
  | `log`         | `LogMailTransport({ body: true })` | local (default) |
  | `memory`      | `InMemoryMailTransport()`         | e2e              |

  Make the default explicit in the config, not a `switch` fallthrough.
- [ ] **`TwigTemplateEngine`** extends `MailTemplateEngine`. It renders
      `views/<name>.twig` through the existing `VIEW_RENDER_ENGINE` provider, so template functions
      such as `url()` work in mail. Provide a text part only if a `<name>.txt.twig` exists;
      otherwise let `@nestjs/mail` derive it.
- [ ] **Mailables**: `WelcomeMail implements Mailable<{ user }>` →
      `{ subject, template: 'emails/welcome', context }`. One class per email.
- [ ] **`MailService` facade**: `send(MailClass, { to, data, idempotencyKey? })` returns the
      `send()` result; `render(...)` is for previews. It does not catch errors; callers can read
      `MailError.permanent`.
- [ ] **After-commit sending**: when a mail must go out only after a DB commit, send it from a
      listener scheduled through `EventRegisterCallbackService.registerEventCallBacks(transaction)`
      (AGENTS.md pattern). No `@nestjs/outbox`.
- [ ] Optional: `src/mail/listeners/mail-events.listener.ts` subscribes to `MailEvents.events$` and
      logs sent/failed without the body.
- [ ] **Tests**:
  - [ ] delete `mail-config.service.spec.ts` and `mail.service.spec.ts` (they test framework wiring
        of the old mailer, which AGENTS.md says not to unit test);
  - [ ] add `test/mail/mail.e2e-spec.ts`: send `WelcomeMail` through the real module and assert on
        the `InMemoryMailTransport` (`assertSent({ to, subject })`, plus a rendered-HTML snippet from
        the Twig template);
  - [ ] in `basicE2eSetup`, rely on `MAIL_DRIVER=memory` from `test/e2e-env.ts`, or
        `.overrideProvider(MailTransport).useValue(new InMemoryMailTransport())`, and expose it to
        suites through a helper.
- [ ] Remove the `mail/services/mail-config` coverage excludes if the paths change.
- [ ] AGENTS.md "Templates": mail is sent via Mailable classes + `MailService.send`, and templates
      stay Twig under `views/emails/`.

## Check

- `MAIL_DRIVER=log`: a tinker call to `mailService.send(WelcomeMail, …)` prints the rendered message.
- `MAIL_DRIVER=smtp` against Mailpit on `localhost:1025` delivers with the right `from`, subject and
  HTML.
- `grep -rn "nestjs-modules/mailer\|nodemailer" src test package.json` returns nothing.
