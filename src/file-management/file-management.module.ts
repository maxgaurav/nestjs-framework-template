import { Module } from '@nestjs/common';
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { join } from 'path';

@Module({
  imports: [
    NestjsFormDataModule.config({
      storage: FileSystemStoredFile,
      autoDeleteFile: true,
      fileSystemStoragePath: join(process.cwd(), 'storage', 'uploads', 'tmp'),
      isGlobal: true,
    }),
  ],
  providers: [],
})
export class FileManagementModule {}
