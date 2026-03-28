import { SystemConfig } from '../environment-types.interface';

export const systemConfig = () => {
  const port = process.env.APP_PORT ? parseFloat(process.env.APP_PORT) : 3000;
  return {
    system: {
      port,
      secret: process.env.APP_SECRET,
      debug: process.env.APP_DEBUG === 'true',
      maxHeapMemory: process.env.APP_MAX_HEAP_MEMORY
        ? parseFloat(process.env.APP_MAX_HEAP_MEMORY)
        : 150, // in MB
      maxRssMemory: process.env.APP_MAX_RSS_MEMORY
        ? parseFloat(process.env.APP_MAX_RSS_MEMORY)
        : 150, // in MB
      checkMemory: process.env.APP_CHECK_MEMORY === 'true',
      url: process.env.APP_URL
        ? process.env.APP_URL
        : `http://localhost:${port}`,
    } as SystemConfig,
  };
};
