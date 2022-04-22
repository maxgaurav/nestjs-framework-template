import { Global, Module } from '@nestjs/common';
import { FileUploadModule } from './file-upload/file-upload.module';
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { join } from 'path';

@Global()
@Module({
  imports: [
    FileUploadModule,
    NestjsFormDataModule.config({
      storage: FileSystemStoredFile,
      autoDeleteFile: true,
      fileSystemStoragePath: join(process.cwd(), 'storage', 'uploads', 'tmp'),
    }),
  ],
  providers: [],
  exports: [NestjsFormDataModule],
})
export class FileManagementModule {}
