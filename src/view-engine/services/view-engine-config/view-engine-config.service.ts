import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { VIEW_RENDER_ENGINE } from '../../constants';
import { ConfigService } from '@nestjs/config';
import { ViewConfig } from '../../../environment/interfaces/environment-types.interface';
import * as Twig from 'twig';

@Injectable()
export class ViewEngineConfigService implements OnApplicationBootstrap {
  constructor(
    @Inject(VIEW_RENDER_ENGINE) private viewEngine: typeof Twig,
    private configService: ConfigService,
  ) {}

  onApplicationBootstrap(): any {
    const viewConfig = this.configService.get<ViewConfig>('view');
    this.viewEngine.cache(viewConfig.templateCaching);
  }
}
