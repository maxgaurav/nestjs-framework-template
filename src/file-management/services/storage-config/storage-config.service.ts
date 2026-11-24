import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import {
  LocalDisk,
  S3Disk,
  type StorageDisk,
  type StorageModuleOptions,
  type StorageOptionsFactory,
} from '@nestjs/storage';
import { StorageConfig } from '../../../environment/environment-types.interface.js';
import { StorageDisks } from '../../storage-disks.js';

/**
 * Builds the disks from the `storage` config: local folders by default,
 * one S3-compatible bucket (with key prefixes) when STORAGE_DRIVER=s3
 */
@Injectable()
export class StorageConfigService implements StorageOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createStorageOptions(): StorageModuleOptions {
    const storage = this.configService.getOrThrow<StorageConfig>('storage');
    return {
      default: StorageDisks.Private,
      disks: {
        [StorageDisks.Private]: this.privateDisk(storage),
        [StorageDisks.Public]: this.publicDisk(storage),
      },
    };
  }

  /**
   * Local: signed links point at this app's /files/private route. S3: presigned by the bucket.
   */
  protected privateDisk(storage: StorageConfig): StorageDisk {
    if (storage.driver === 's3') {
      return this.s3Disk(storage, `${storage.root}private/`);
    }

    return new LocalDisk({
      root: join(storage.root, StorageDisks.Private),
      signedUrls: {
        baseUrl: `${storage.signedUrlBase}/${StorageDisks.Private}`,
        keys: storage.signingKeys,
      },
    });
  }

  /**
   * Local: served as static files under /storage (see main.ts). S3: the prefix must be public
   * in the bucket policy, or fronted by a CDN set as STORAGE_PUBLIC_URL.
   */
  protected publicDisk(storage: StorageConfig): StorageDisk {
    if (storage.driver === 's3') {
      return this.s3Disk(storage, `${storage.root}public/`, storage.publicUrl);
    }

    return new LocalDisk({
      root: join(storage.root, StorageDisks.Public),
      publicUrl: storage.publicUrl,
    });
  }

  protected s3Disk(
    storage: StorageConfig,
    prefix: string,
    publicUrl?: string,
  ): StorageDisk {
    return new S3Disk({
      bucket: storage.s3.bucket,
      region: storage.s3.region,
      endpoint: storage.s3.endpoint,
      forcePathStyle: storage.s3.forcePathStyle,
      credentials: storage.s3.credentials,
      prefix,
      publicUrl,
    });
  }
}
