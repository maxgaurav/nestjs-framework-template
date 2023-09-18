import { CorsConfig } from '../environment-types.interface';

export const corsConfig = () => ({
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  } as CorsConfig,
});
