import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { TEMPLATE_FUNCTIONS, VIEW_RENDER_ENGINE } from '../../constants';
import { ConfigService } from '@nestjs/config';
import { ViewConfig } from '../../../environment/environment-types.interface';
import * as Twig from 'twig';
import type { TemplateFunctionRegistrations } from '../../template-functions/template-function-registration';
import { ModuleRef } from '@nestjs/core';
import { ExtendFunction } from '../../template-functions/extend-function';

@Injectable()
export class ViewEngineConfigService implements OnModuleInit {
  constructor(
    @Inject(VIEW_RENDER_ENGINE) private viewEngine: typeof Twig,
    private configService: ConfigService,
    protected moduleRef: ModuleRef,
    @Inject(TEMPLATE_FUNCTIONS)
    protected templateFunctions: typeof TemplateFunctionRegistrations,
  ) {}

  public async onModuleInit(): Promise<any> {
    const viewConfig = this.configService.getOrThrow<ViewConfig>('view');
    this.viewEngine.cache(viewConfig.templateCaching);
    await this.registerFunctions();
  }

  protected async registerFunctions(): Promise<boolean> {
    const registrations: Promise<boolean>[] = this.templateFunctions.map(
      async (instanceClass) => {
        const instance =
          await this.moduleRef.resolve<ExtendFunction>(instanceClass);
        this.viewEngine.extendFunction(
          instance.functionName(),
          instance.handler.bind(instance),
        );
        return true;
      },
    );

    return Promise.all(registrations).then(() => true);
  }
}
