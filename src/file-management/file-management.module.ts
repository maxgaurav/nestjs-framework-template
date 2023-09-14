import { Global, Module } from '@nestjs/common';
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { join } from 'path';

@Global()
@Module({
  imports: [
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
