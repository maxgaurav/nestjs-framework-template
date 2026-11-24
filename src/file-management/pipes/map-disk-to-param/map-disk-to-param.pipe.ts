import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { Storage, StorageDisk } from '@nestjs/storage';
import { SIGNED_URL_DISKS } from '../../storage-disks.js';

/**
 * Resolves the `disk` route param to a disk whose signed links this app serves
 */
@Injectable()
export class MapDiskToParamPipe implements PipeTransform<string, StorageDisk> {
  constructor(private readonly storage: Storage) {}

  transform(name: string): StorageDisk {
    if (!SIGNED_URL_DISKS.includes(name)) {
      throw new NotFoundException();
    }

    return this.storage.disk(name);
  }
}
