import { SessionConfig } from '../interfaces/environment-types.interface';

export const sessionConfig = () => {
  return {
    session: {
      driver: process.env.SESSION_DRIVER || 'memory',
      secret: process.env.APP_SECRET,
      name: process.env.SESSION_NAME || 'nestjs-session',
      resave: !!process.env.SESSION_RESAVE
        ? process.env.SESSION_RESAVE === 'true'
        : true,
      saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED === 'true',
    } as SessionConfig,
  };
};
