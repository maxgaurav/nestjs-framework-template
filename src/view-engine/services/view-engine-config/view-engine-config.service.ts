import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import * as hbs from 'hbs';
import { join } from 'path';
import * as layouts from 'handlebars-layout';

@Injectable()
export class ViewEngineConfigService implements OnApplicationBootstrap {
  onApplicationBootstrap(): any {
    hbs.registerPartials(join(process.cwd(), 'views', 'partials'));
    hbs.registerPartials(join(process.cwd(), 'views', 'layouts'));
    hbs.registerHelper('layoutName', function (name: string) {
      return `./dist/view-engine/views/layouts/${name}`;
    });
    layouts.register(hbs.handlebars);
  }
}
