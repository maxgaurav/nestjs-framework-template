import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadConfigService } from './services/upload-config/upload-config.service';
import { ConfigService } from '@nestjs/config';
import { SetupUploadSystemsService } from './services/setup-upload-systems/setup-upload-systems.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: UploadConfigService,
      imports: [ConfigService],
    }),
  ],
  providers: [UploadConfigService, SetupUploadSystemsService],
})
export class FileUploadModule {}
