import { Global, Module } from '@nestjs/common';
import { UrlBuilderService } from './services/url-builder/url-builder.service';

@Global()
@Module({
  providers: [UrlBuilderService],
  exports: [UrlBuilderService],
})
export class UrlManagementModule {}
