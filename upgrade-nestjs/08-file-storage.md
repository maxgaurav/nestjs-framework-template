# 08 — File storage: `@nestjs/storage` (keeping `nestjs-form-data` for input)

**Status: not started**

Docs: https://docs.nestjs.com/application/file-storage. Reference: wisekeep phase 08 (done).

## Package facts

- `@nestjs/storage@0.0.5`, peer `@nestjs/common` / `@nestjs/core` `^12.1.0`. **Pin exactly.**
- Disks: `LocalDisk`, `S3Disk` (S3, R2, MinIO, B2, GCS interop; SigV4 over `fetch`, **no AWS SDK**,
  multipart above 8 MiB) and `InMemoryDisk` (tests).
- `StorageModule.forRootAsync({ inject, useFactory })` → `{ default, disks }`. It is global.
  Misconfiguration (unknown default disk, a signing key under 32 chars, missing S3 settings, an
  unknown `@InjectDisk`) fails at boot.
- Injection: `StorageDisk` (the default disk), `@InjectDisk('name')`, or `Storage.disk(name)`.
- Disk API: `put` / `get` / `getBuffer` / `getText` / `stat` / `exists` / `delete` / `list` /
  `listAll` / `copy` / `move` / `url` / `signedUrl` / `signedUpload`.
- HTTP helpers: `serveFile` (Range/206, ETag/304, nosniff), `serveSignedUrl`, `receiveSignedUpload`,
  and `uploadToDisk` (a multer engine; **not used here**, see 8.2).
- Errors extend `StorageError`, **not** `HttpException`, so we need a filter.

## 8.1 Module, config, errors, signed route

- [ ] `npm i @nestjs/storage@0.0.5 --save-exact`
- [ ] **Config**: replace `filesystemConfig.ts` / `FilesystemConfig` with
      `src/environment/configs/storage.ts` (`StorageConfig` in `environment-types.interface.ts`),
      registered in `EnvironmentModule`:

  | Env                                   | Default                    | Purpose                                             |
  | ------------------------------------- | -------------------------- | --------------------------------------------------- |
  | `STORAGE_DRIVER`                      | `local`                    | `local` or `s3` for the `public` and `private` disks |
  | `STORAGE_ROOT`                        | `storage/app`              | local root (subfolders `public/`, `private/`), or S3 key prefix |
  | `STORAGE_SIGNING_KEYS`                | derived from `APP_SECRET` (SHA-256) when unset | comma-separated, ≥ 32 chars each, the first one signs |
  | `STORAGE_SIGNED_URL_BASE`             | `${APP_URL}/files`         | route that serves local signed links                |
  | `STORAGE_PUBLIC_URL`                  | `${APP_URL}/storage`       | `publicUrl` of the public disk                      |
  | `S3_BUCKET` / `S3_REGION` / `S3_ENDPOINT` / `S3_FORCE_PATH_STYLE` | none / `auto` / none / `false` | S3, R2 or MinIO |
  | `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | fall back to `AWS_*`  | credentials                                         |

  Update `.env.example`. Add `storage/app/` to `.gitignore` (LocalDisk also creates `.nest-storage/`
  inside each root).
- [ ] **Disks**: `private` is the default (signed links only), and `public` has a `publicUrl`. Add
      more only when a feature needs one. Disk names are constants in
      `src/file-management/storage-disks.ts` (`StorageDisks.Private`, `StorageDisks.Public`); no
      bare strings in `@InjectDisk(...)`.
- [ ] **Module**: `StorageModule.forRootAsync` in `FileManagementModule`. The factory is
      `src/file-management/services/storage-config/storage-config.service.ts` (folder-per-class), and
      it builds `LocalDisk` or `S3Disk` from `StorageConfig`.
- [ ] **`StorageErrorFilter`** in `src/helpers/filters/storage-error/storage-error.filter.ts`
      (port from wisekeep): it uses each error's `status` (400 / 404 / 409 / 416 / 403),
      `StorageServiceError` → 502 (logged), everything else → 500. Register it in `main.ts` **and**
      `basicE2eSetup`. Check the interaction with `NotFoundConverterInterceptor`: a missing file
      must be a 404.
- [ ] **Signed-link route**: `SignedFileController` at
      `src/file-management/controllers/signed-file/signed-file.controller.ts`, `GET /files/:disk` →
      `serveSignedUrl(disk, { req, res })`. The key travels in the query, so no wildcard is needed.
      `MapDiskToParamPipe` returns 404 for disks without `signedUrls`. Mark it
      `@ApiExcludeController()`, with no auth guard (the signature is the authorization) and no
      resource conversion. On S3, links are presigned and this route is unused.
- [ ] Remove the `filesystem` config and interface.

## 8.2 Uploads: keep `nestjs-form-data`, persist to a disk

**Decision:** keep `nestjs-form-data`, so upload validation stays declarative in DTOs (`@IsFile()`,
`@MaxFileSize()`, `@HasMimeType()`) and goes through the same `ValidationPipe` → 422 format as every
other field. `uploadToDisk()` would move that validation into `FileInterceptor` options and return
415 / 413 instead of our 422 shape.

Trade-offs we accept:

- The file is written twice: once to `storage/uploads/tmp`, then streamed to the disk. That is fine
  at template scale. Large-binary endpoints (installers, video) can use `FileInterceptor` +
  `uploadToDisk()` case by case.
- `nestjs-form-data` peers stop at Nest 11 and class-validator 0.14. We use npm `overrides` (phase 03)
  and stay on class-validator 0.14 until upstream catches up.
- Content sniffing: check whether `@HasMimeType` on the pinned version checks magic bytes or only
  the declared `Content-Type`. If only the declared type, add a small custom validator that uses
  `detectContentType()` from `@nestjs/storage` on the temp file's first bytes.

Tasks:

- [ ] Keep `NestjsFormDataModule.config({ storage: FileSystemStoredFile, autoDeleteFile: true, ... })`.
      `autoDeleteFile` removes the temp file after the response, so the disk write must finish
      inside the request.
- [ ] Add `FileStorageService` (`src/file-management/services/file-storage/file-storage.service.ts`):
      `store(file: FileSystemStoredFile, { disk, prefix }) → { disk, key, size, contentType }`. It
      streams `createReadStream(file.path)` into `disk.put(key, stream, { contentType, contentLength })`.
      The default key is a UUID plus the original extension (never the client file name).
- [ ] Reference example in the template: `PATCH /api/v1/users/:userId/avatar`
      (`UpdateUserAvatarDto` with `@IsFile` / `@MaxFileSize` / `@HasMimeType`, `@FormDataRequest()`,
      `MapUserToParamPipe`, `AccessTokenGuard`, ownership check). The service stores to the `public`
      disk, the repository saves the key, and the resource exposes `avatarUrl` via `disk.url(key)`.
      Only add this if the template should ship an upload example; otherwise skip it and keep just
      the service plus the e2e test below.
- [ ] **Fallback** if the `nestjs-form-data` override breaks on Nest 12: move the handlers to
      `FileInterceptor` + `uploadToDisk({ disk, contentTypes })`, keep field names, and map 415/413
      to the 422 validation shape in the filter. Do not hand-roll multer validation.

## 8.3 Tests

- [ ] `basicE2eSetup`: `.overrideProvider(STORAGE_MODULE_OPTIONS).useFactory(...)` with
      `InMemoryDisk`s that use the same disk names and the configured signing keys, so tests never
      touch `storage/` or S3. Expose the disks to suites for assertions.
- [ ] `test/file-management/signed-file.e2e-spec.ts`: signed download 200, Range 206, tampered link
      403, expired link 403 (`vi.setSystemTime`), missing key 404, disk without signed links 404.
- [ ] Upload e2e (example endpoint or a test-only controller): a valid file returns 2xx and the key
      exists on the in-memory disk; a wrong type or oversized file returns 422 with the standard
      error shape; the temp file is removed.
- [ ] `storage-error.filter.spec.ts`: the status mapping (small, pure logic, so a unit test fits).
- [ ] No unit tests for the factory wiring.
- [ ] Manual, optional: `STORAGE_DRIVER=s3` against a MinIO container (`forcePathStyle`): boot,
      put/get, presigned GET.

## Check

- The app boots with the default env, and the local roots are created under `storage/app`.
- `STORAGE_DRIVER=s3` without a bucket fails at boot with a clear error.
- E2E above passes. `/api-documentation/v1` changes only by the example endpoint, if it was added.
