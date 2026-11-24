import { Global, Module, Provider } from '@nestjs/common';
import { ViewEngineConfigService } from './services/view-engine-config/view-engine-config.service.js';
import { TEMPLATE_FUNCTIONS, VIEW_RENDER_ENGINE } from './constants.js';
import { UrlBuilderFunction } from './template-functions/url-builder/url-builder.function.js';
import Twig from 'twig';
import { TemplateFunctionRegistrations } from './template-functions/template-function-registration.js';
import { QueryFunction } from './template-functions/query/query.function.js';
import { SessionFunction } from './template-functions/session/session.function.js';
import { PathParamFunction } from './template-functions/path-param/path-param.function.js';

const ViewEngineProvider: Provider = {
  provide: VIEW_RENDER_ENGINE,
  useValue: Twig,
};

@Global()
@Module({
  providers: [
    ViewEngineConfigService,
    ViewEngineProvider,
    UrlBuilderFunction,
    QueryFunction,
    SessionFunction,
    PathParamFunction,
    {
      provide: TEMPLATE_FUNCTIONS,
      useValue: TemplateFunctionRegistrations,
    },
  ],
  exports: [ViewEngineProvider],
})
export class ViewEngineModule {}
