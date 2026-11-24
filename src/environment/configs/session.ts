import { SessionConfig } from '../environment-types.interface.js';
import { requiredEnv } from '../helpers/required-env.js';

export const sessionConfig = () => {
  return {
    session: {
      // Anything other than `file` uses the in-memory store
      driver: process.env['SESSION_DRIVER'] === 'file' ? 'file' : 'memory',
      secret: requiredEnv('APP_SECRET'),
      name: process.env['SESSION_NAME'] || 'nestjs-session',
      resave: process.env['SESSION_RESAVE']
        ? process.env['SESSION_RESAVE'] === 'true'
        : true,
      saveUninitialized: process.env['SAVE_UNINITIALIZED'] === 'true',
      secureCookie: process.env['SESSION_SECURE_COOKIE'] === 'true',
    } satisfies SessionConfig,
  };
};
