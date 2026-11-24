import { Body, Controller, Module, Post } from '@nestjs/common';
import { Storage } from '@nestjs/storage';
import {
  FileSystemStoredFile,
  FormDataRequest,
  HasMimeType,
  IsFile,
  MaxFileSize,
  MetaSource,
} from 'nestjs-form-data';
import { AppModule } from '../../src/app.module.js';
import { FileStorageService } from '../../src/file-management/services/file-storage/file-storage.service.js';
import { StorageDisks } from '../../src/file-management/storage-disks.js';
import { FileManagementModule } from '../../src/file-management/file-management.module.js';

export const PROBE_MAX_FILE_SIZE = 10 * 1024;

/** The pattern a real upload DTO follows: validation lives in the DTO */
class UploadProbeDto {
  @IsFile()
  @MaxFileSize(PROBE_MAX_FILE_SIZE)
  // Checked against the file's magic bytes, not the client's Content-Type
  @HasMimeType(['image/png'], MetaSource.bufferMagicNumber)
  file: FileSystemStoredFile;
}

/**
 * Test-only controller: nestjs-form-data validates, FileStorageService stores
 */
@Controller('upload-probe')
export class UploadProbeController {
  constructor(
    private readonly fileStorage: FileStorageService,
    private readonly storage: Storage,
  ) {}

  @Post()
  @FormDataRequest()
  public async store(@Body() dto: UploadProbeDto) {
    const stored = await this.fileStorage.store(dto.file, {
      disk: StorageDisks.Public,
      prefix: 'avatars',
    });
    return { ...stored, url: this.storage.disk(stored.disk).url(stored.key) };
  }
}

@Module({
  // Feature modules import FileManagementModule to get FileStorageService
  imports: [AppModule, FileManagementModule],
  controllers: [UploadProbeController],
})
export class UploadProbeModule {}
