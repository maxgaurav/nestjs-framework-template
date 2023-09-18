import { join } from 'path';
import { ViewConfig } from '../environment-types.interface';

export const viewConfig = () => ({
  view: {
    viewPath: join(process.cwd(), 'views'),
    publicPath: join(process.cwd(), 'public'),
    templateCaching: process.env.VIEW_TEMPLATE_CACHING === 'true',
  } as ViewConfig,
});
