import { SystemConfig } from '../interfaces/environment-types.interface';

export const systemConfig = () => ({
  system: {
    port: process.env.APP_PORT ? parseFloat(process.env.APP_PORT) : 3000,
    debug: process.env.APP_DEBUG === 'true',
    maxMemory: process.env.APP_MAX_MEMORY
      ? parseFloat(process.env.APP_MAX_MEMORY)
      : 2048, // in MB
  } as SystemConfig,
});
