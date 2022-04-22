import { Injectable } from '@nestjs/common';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express/multer/interfaces/files-upload-module.interface';
import { ConfigService } from '@nestjs/config';
import { FilesystemConfig } from '../../../../environment/interfaces/environment-types.interface';
import { uploadFilesystems } from '../../../filesystems';

@Injectable()
export class UploadConfigService implements MulterOptionsFactory {
  constructor(private configService: ConfigService) {}

  public createMulterOptions():
    | Promise<MulterModuleOptions>
    | MulterModuleOptions {
    const defaultDriver =
      this.configService.get<FilesystemConfig>('filesystem').defaultDriver;
    if (uploadFilesystems.hasOwnProperty(defaultDriver)) {
      return uploadFilesystems[defaultDriver].multer;
    }

    return {};
  }
}
