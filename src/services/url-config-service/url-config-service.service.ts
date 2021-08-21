import { Injectable } from '@nestjs/common';
import {
  UrlGeneratorModuleOptions,
  UrlGeneratorModuleOptionsFactory,
} from 'nestjs-url-generator';
import { ConfigService } from '@nestjs/config';
import { SystemConfig } from '../../environment/interfaces/environment-types.interface';

@Injectable()
export class UrlConfigServiceService
  implements UrlGeneratorModuleOptionsFactory
{
  constructor(private configService: ConfigService) {}

  createUrlGeneratorOptions():
    | Promise<UrlGeneratorModuleOptions>
    | UrlGeneratorModuleOptions {
    const { secret, url: appUrl } =
      this.configService.get<SystemConfig>('system');

    return { secret, appUrl };
  }
}
