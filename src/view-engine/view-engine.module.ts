import { Global, Module, Provider } from '@nestjs/common';
import { ViewEngineConfigService } from './services/view-engine-config/view-engine-config.service';
import { HANDLEBAR_ENGINE } from './constants';
import * as hbs from 'hbs';

const ViewEngineProvider: Provider = {
  provide: HANDLEBAR_ENGINE,
  useValue: hbs,
};

@Global()
@Module({
  providers: [ViewEngineConfigService, ViewEngineProvider],
  exports: [ViewEngineProvider],
})
export class ViewEngineModule {}
