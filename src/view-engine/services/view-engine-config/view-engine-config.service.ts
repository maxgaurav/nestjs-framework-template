import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import * as HBS from 'hbs';
import { join } from 'path';
import * as layouts from 'handlebars-layout';
import { HANDLEBAR_ENGINE } from '../../constants';
import { ConfigService } from '@nestjs/config';
import { ViewConfig } from '../../../environment/interfaces/environment-types.interface';

@Injectable()
export class ViewEngineConfigService implements OnApplicationBootstrap {
  constructor(
    @Inject(HANDLEBAR_ENGINE) private hbs: typeof HBS,
    private configService: ConfigService,
  ) {}

  onApplicationBootstrap(): any {
    const viewConfig = this.configService.get<ViewConfig>('view');
    this.hbs.registerPartials(join(viewConfig.viewPath, 'partials'));
    this.hbs.registerHelper('layoutName', function (name: string) {
      return `./dist/view-engine/views/layouts/${name}`;
    });
    layouts.register(this.hbs.handlebars);
  }
}
