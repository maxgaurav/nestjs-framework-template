import type { NestExpressApplication } from '@nestjs/platform-express';
import type { ServerResponse } from 'node:http';
import { join } from 'node:path';
import { StorageConfig } from '../../environment/environment-types.interface.js';
import { StorageDisks } from '../storage-disks.js';

/**
 * Serves the local public disk under /storage. User uploads are served from the app's own
 * origin, so they are sandboxed: an uploaded HTML/SVG file cannot run scripts as the app.
 * With STORAGE_DRIVER=s3 the bucket (or a CDN) serves public files instead.
 */
export function serveLocalPublicDisk(
  app: NestExpressApplication,
  storage: StorageConfig,
) {
  if (storage.driver !== 'local') {
    return;
  }

  app.useStaticAssets(join(storage.root, StorageDisks.Public), {
    prefix: '/storage',
    index: false,
    dotfiles: 'ignore',
    setHeaders: (res: ServerResponse) => {
      res.setHeader('Content-Security-Policy', 'sandbox');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  });
}
