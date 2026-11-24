import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { StorageConfig } from '../environment-types.interface.js';

const csv = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

/**
 * Explicit STORAGE_SIGNING_KEYS win (first signs, all verify: rotation). Otherwise one key
 * is derived from APP_SECRET, so a fresh environment works without another secret.
 */
const signingKeys = (): string[] => {
  const keys = csv(process.env.STORAGE_SIGNING_KEYS);
  if (keys.length > 0 || !process.env.APP_SECRET) {
    return keys;
  }

  return [
    createHash('sha256')
      .update(`storage-signing:${process.env.APP_SECRET}`)
      .digest('hex'),
  ];
};

/**
 * Where the public disk's files are reachable. `disk.url(key)` appends the key to this base,
 * so for S3 it must point at the `public/` prefix: a CDN in front of it (STORAGE_PUBLIC_URL),
 * or by default the bucket itself (path style with a custom endpoint, AWS virtual-hosted
 * otherwise). Locally the app serves the disk under /storage.
 */
const publicUrl = (
  driver: StorageConfig['driver'],
  appUrl: string,
  root: string,
  s3: StorageConfig['s3'],
): string => {
  if (process.env.STORAGE_PUBLIC_URL) {
    return process.env.STORAGE_PUBLIC_URL;
  }
  if (driver === 'local') {
    return `${appUrl}/storage`;
  }

  const bucketBase = s3.endpoint
    ? `${s3.endpoint.replace(/\/$/, '')}/${s3.bucket}`
    : `https://${s3.bucket}.s3.${s3.region}.amazonaws.com`;
  return `${bucketBase}/${root}public`;
};

export const storageConfig = () => {
  const appUrl = (process.env.APP_URL || 'http://localhost').replace(/\/$/, '');
  const driver = process.env.STORAGE_DRIVER === 's3' ? 's3' : 'local';
  const root =
    process.env.STORAGE_ROOT ||
    (driver === 's3' ? '' : join(process.cwd(), 'storage', 'app'));
  const s3: StorageConfig['s3'] = {
    bucket: process.env.S3_BUCKET ?? '',
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    // Unset: the S3 disk falls back to the AWS_* environment credentials
    credentials: process.env.S3_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        }
      : undefined,
  };

  const config: StorageConfig = {
    driver,
    // Local: folder holding private/ and public/. S3: key prefix inside the bucket.
    root,
    signingKeys: signingKeys(),
    signedUrlBase: process.env.STORAGE_SIGNED_URL_BASE || `${appUrl}/files`,
    publicUrl: publicUrl(driver, appUrl, root, s3),
    s3,
  };

  return { storage: config };
};
