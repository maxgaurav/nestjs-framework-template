/**
 * Names of the @nestjs/storage disks; use these with @InjectDisk() / Storage.disk(),
 * never bare strings
 */
export enum StorageDisks {
  /** Default disk. Files are only reachable through signed, expiring links */
  Private = 'private',
  /** Files are reachable by URL (`disk.url(key)`): static route, public bucket or CDN */
  Public = 'public',
}

/**
 * Disks whose signed links are served by this app's /files/:disk route. S3 disks presign
 * links that the bucket verifies itself, so the route only serves local disks.
 */
export const SIGNED_URL_DISKS: readonly string[] = [StorageDisks.Private];
