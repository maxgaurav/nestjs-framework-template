import { Module } from '@nestjs/common';
import { ViewEngineConfigService } from './services/view-engine-config/view-engine-config.service';

@Module({
  providers: [ViewEngineConfigService],
})
export class ViewEngineModule {}
