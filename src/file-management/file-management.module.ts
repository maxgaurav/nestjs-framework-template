import { Module } from '@nestjs/common';
import { StorageModule } from '@nestjs/storage';
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { join } from 'node:path';
import { StorageConfigService } from './services/storage-config/storage-config.service.js';
import { FileStorageService } from './services/file-storage/file-storage.service.js';
import { SignedFileController } from './controllers/signed-file/signed-file.controller.js';
import { MapDiskToParamPipe } from './pipes/map-disk-to-param/map-disk-to-param.pipe.js';

@Module({
  imports: [
    // Multipart input: files are validated in DTOs, then moved to a disk by FileStorageService
    NestjsFormDataModule.config({
      storage: FileSystemStoredFile,
      cleanupAfterSuccessHandle: true,
      cleanupAfterFailedHandle: true,
      fileSystemStoragePath: join(process.cwd(), 'storage', 'uploads', 'tmp'),
      isGlobal: true,
    }),
    // Global: Storage, the default StorageDisk and @InjectDisk(StorageDisks.*) everywhere
    StorageModule.forRootAsync({ useClass: StorageConfigService }),
  ],
  controllers: [SignedFileController],
  providers: [MapDiskToParamPipe, FileStorageService],
  exports: [FileStorageService],
})
export class FileManagementModule {}
