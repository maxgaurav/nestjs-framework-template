import { join } from 'path';
import { ViewConfig } from '../interfaces/environment-types.interface';

export const viewConfig = () => ({
  view: {
    viewPath: join(process.cwd(), 'dist', 'view-engine', 'views'),
    publicPath: join(process.cwd(), 'public'),
  } as ViewConfig,
});
