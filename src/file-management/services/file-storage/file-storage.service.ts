import { Injectable } from '@nestjs/common';
import { Storage } from '@nestjs/storage';
import { FileSystemStoredFile } from 'nestjs-form-data';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { StorageDisks } from '../../storage-disks.js';

export interface StoreFileOptions {
  /** Target disk; the private disk by default */
  disk?: StorageDisks;
  /** Key prefix, e.g. `avatars` (a trailing `/` is added) */
  prefix?: string;
}

export interface StoredFileResult {
  disk: StorageDisks;
  key: string;
  size: number;
  contentType: string;
}

/**
 * Moves an upload that a nestjs-form-data DTO has already validated (`@IsFile`,
 * `@MaxFileSize`, `@HasMimeType`) from its temp file onto a storage disk.
 *
 * Await it inside the request: nestjs-form-data deletes the temp file once the handler
 * finishes. The key is a random UUID plus the detected extension; the client's file name is
 * never used as a path.
 */
@Injectable()
export class FileStorageService {
  constructor(private readonly storage: Storage) {}

  public async store(
    file: FileSystemStoredFile,
    { disk = StorageDisks.Private, prefix }: StoreFileOptions = {},
  ): Promise<StoredFileResult> {
    const folder = prefix ? `${prefix.replace(/\/+$/, '')}/` : '';
    const extension = file.extension ? `.${file.extension}` : '';
    const key = `${folder}${randomUUID()}${extension}`;

    const written = await this.storage
      .disk(disk)
      .put(key, createReadStream(file.path), {
        contentType: file.mimeType,
        contentLength: file.size,
      });

    return {
      disk,
      key: written.key,
      size: written.size,
      contentType: written.contentType,
    };
  }
}
