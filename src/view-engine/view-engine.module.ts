import { Global, Module, Provider } from '@nestjs/common';
import { ViewEngineConfigService } from './services/view-engine-config/view-engine-config.service';
import { TEMPLATE_FUNCTIONS, VIEW_RENDER_ENGINE } from './constants';
import { UrlBuilderFunction } from './template-functions/url-builder/url-builder.function';
import * as Twig from 'twig';
import { TemplateFunctionRegistrations } from './template-functions/template-function-registration';
import { QueryFunction } from './template-functions/query/query.function';
import { SessionFunction } from './template-functions/session/session.function';
import { PathParamFunction } from './template-functions/path-param/path-param.function';

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
