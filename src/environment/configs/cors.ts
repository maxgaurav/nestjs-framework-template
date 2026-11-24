import { CorsConfig } from '../environment-types.interface.js';

export const corsConfig = () => ({
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  } satisfies CorsConfig,
});
