import { SystemConfig } from '../interfaces/environment-types.interface';

export const systemConfig = () => ({
  system: {
    port: process.env.APP_PORT ? parseFloat(process.env.APP_PORT) : 3000,
    debug: process.env.APP_DEBUG === 'true',
    maxHeapMemory: process.env.APP_MAX_HEAP_MEMORY
      ? parseFloat(process.env.APP_MAX_HEAP_MEMORY)
      : 150, // in MB
    maxRssMemory: process.env.APP_MAX_RSS_MEMORY
      ? parseFloat(process.env.APP_MAX_RSS_MEMORY)
      : 150, // in MB
    checkMemory: process.env.APP_CHECK_MEMORY === 'true',
  } as SystemConfig,
});
