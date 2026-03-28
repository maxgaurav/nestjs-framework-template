import { SessionConfig } from '../environment-types.interface';

export const sessionConfig = () => {
  return {
    session: {
      driver: process.env.SESSION_DRIVER || 'memory',
      secret: process.env.APP_SECRET,
      name: process.env.SESSION_NAME || 'nestjs-session',
      resave: process.env.SESSION_RESAVE
        ? process.env.SESSION_RESAVE === 'true'
        : true,
      saveUninitialized: process.env.SAVE_UNINITIALIZED === 'true',
      secureCookie: process.env.SESSION_SECURE_COOKIE === 'true',
    } as SessionConfig,
  };
};
