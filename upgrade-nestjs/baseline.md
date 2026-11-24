# Baseline (`master` @ `f62f6cf`, 2026-11-24, Node 24.22.1)

| Check | Result |
| ----- | ------ |
| `npm run build` (nest + SWC + typeCheck) | ✅ about 9.2 s |
| `npm run lint` (ESLint 9) | ✅ 0 errors, 7 warnings (`no-floating-promises`, `no-unsafe-argument`), about 10.7 s |
| `npm test` (repo config) | ❌ **74/74 suites fail to run**: `.swcrc` has `"exclude": [".*\\.spec\\.ts$"]`, so `@swc/jest` refuses every spec ("cannot process file because it's ignored by .swcrc"). This is why CI has tests switched off |
| Unit tests with inline SWC options (`swcrc: false`) | 8 failed / 66 passed suites; 25 failed / 217 passed tests (list below) |
| `npm run test:e2e` (inline SWC options) | ✅ 1/1. Needs `--forceExit`: the app is never closed |
| `migration:run` | ✅ 0 pending |
| `route:list` | ✅ 9 routes → [baseline-routes.txt](./baseline-routes.txt) |
| `GET /health` | ✅ `{"status":"ok", database-default up}` |
| OpenAPI | [baseline-openapi.json](./baseline-openapi.json) (2 operations) |

Boot warnings: `DEP0044 util.isArray` (connect-flash); `[MailerService] Transporter is ready` logged
at **ERROR** level by the hand-written log transport; a sequelize `INTEGER` length warning.

## Failing unit tests (with inline SWC options)

- `ClientIdExistsValidator` (12 tests)
- `DatabaseConfigService` (3)
- `OauthController` expiration date helpers (4)
- `UrlBuilderService` (2)
- `HashEncryptService › should encrypt content`
- `MailService › should return file content as string`
- `MethodChangeMiddleware › should keep original state if body override is not string`
- `RefreshTokenService › should pass validation when valid body is passed`

Triage happens in phase 02.
