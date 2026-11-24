import { SystemConfig } from '../environment-types.interface.js';
import { requiredEnv } from '../helpers/required-env.js';

export const systemConfig = () => {
  const port = process.env['APP_PORT']
    ? parseFloat(process.env['APP_PORT'])
    : 3000;
  return {
    system: {
      port,
      secret: requiredEnv('APP_SECRET'),
      // IV for HashEncryptService (aes-256-ctr needs 16 bytes)
      encryptHexKey: process.env['APP_ENCRYPT_HEX_KEY'] || '1bce5155bf46c13c',
      debug: process.env['APP_DEBUG'] === 'true',
      maxHeapMemory: process.env['APP_MAX_HEAP_MEMORY']
        ? parseFloat(process.env['APP_MAX_HEAP_MEMORY'])
        : 150, // in MB
      maxRssMemory: process.env['APP_MAX_RSS_MEMORY']
        ? parseFloat(process.env['APP_MAX_RSS_MEMORY'])
        : 150, // in MB
      checkMemory: process.env['APP_CHECK_MEMORY'] === 'true',
      url: process.env['APP_URL']
        ? process.env['APP_URL']
        : `http://localhost:${port}`,
    } satisfies SystemConfig,
  };
};
