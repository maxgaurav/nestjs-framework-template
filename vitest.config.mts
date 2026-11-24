import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // TEMPORARY until phase 03 replaces nestjs-command with nest-commander: its exports map
      // only has a "require" condition, which Vite's resolver refuses.
      'nestjs-command': fileURLToPath(
        new URL('./node_modules/nestjs-command/dist/index.js', import.meta.url),
      ),
    },
  },
  // Vite 8 transforms TypeScript with oxc. Nest DI and Swagger need legacy decorators with
  // design:* metadata, which oxc emits when asked to (no SWC plugin required).
  oxc: {
    decorator: { legacy: true, emitDecoratorMetadata: true },
  },
  test: {
    globals: true,
    environment: 'node',
    // Worker threads, not child processes: ProcessMessagingService (cluster IPC) listens on
    // process 'message' and would log every vitest IPC message under the forks pool.
    // cls-hooked's async_hooks context is per thread.
    pool: 'threads',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.spec.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          include: ['test/**/*.e2e-spec.ts'],
          setupFiles: ['test/e2e-env.ts'],
          // One shared test database; every test runs inside its own rolled-back transaction
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.module.ts',
        'src/**/*.decorator.ts',
        'src/main.ts',
        'src/cli.ts',
        'src/tinker.ts',
        'src/databases/migrations/**',
        'src/databases/models/**',
        'src/documentation-helper/**',
        'src/environment/configs/**',
        'src/cli-commands/**',
        'src/cluster/**',
        'src/helpers/filters/error-validation-format/**',
        'src/helpers/interceptors/context/**',
        'src/health/controllers/health/**',
        'src/services/logging/**',
        'src/mail/services/mail-config/**',
        'src/transaction-manager/services/transaction-provider/**',
        'src/view-engine/services/view-engine-config/**',
        'src/session-manager/services/session-config/**',
        'src/paginate-overwrite/services/overwrite-paginate.service.ts',
      ],
    },
  },
});
