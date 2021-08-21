import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import * as hbs from 'hbs';
import { join } from 'path';
import * as layouts from 'handlebars-layout';

@Injectable()
export class ViewEngineConfigService implements OnApplicationBootstrap {
  onApplicationBootstrap(): any {
    hbs.registerPartials(join(process.cwd(), 'views', 'partials'));
    hbs.registerPartials(join(process.cwd(), 'views', 'layouts'));
    layouts.register(hbs.handlebars);
  }
}
