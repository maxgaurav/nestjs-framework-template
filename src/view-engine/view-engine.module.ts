import { Global, Module, Provider } from '@nestjs/common';
import { ViewEngineConfigService } from './services/view-engine-config/view-engine-config.service';
import { VIEW_RENDER_ENGINE } from './constants';
import * as Twig from 'twig';

const ViewEngineProvider: Provider = {
  provide: VIEW_RENDER_ENGINE,
  useValue: Twig,
};

@Global()
@Module({
  providers: [ViewEngineConfigService, ViewEngineProvider],
  exports: [ViewEngineProvider],
})
export class ViewEngineModule {}
