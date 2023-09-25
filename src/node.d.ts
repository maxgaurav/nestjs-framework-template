declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'production' | 'local';
      APP_PORT: `${number}`;
      OVERRIDE_ENV: string | undefined;
      APP_URL: string;
      APP_DEBUG?: 'true' | 'false';
      APP_SECRET: string;
      DB_HOST: string;
      DB_NAME: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      DB_PORT?: `${number}`;
      DB_DEBUG?: 'true' | 'false';
      DB_POOL_CONNECTION_LIMIT?: `${number}`;
      DB_TIMEZONE?: string;
      CLUSTER_ENABLE: 'false' | 'true';
      CLUSTER_MAX_CPU: `${number}`;
      CLUSTER_MAX_ATTEMPTS: `${number}`;
      MAIL_DRIVER: `smtp` | 'log';
      MAIL_FROM_NAME: string;
      MAIL_FROM_ADDRESS: string;
      MAIL_SMTP_HOST?: string;
      MAIL_SMTP_PORT?: string;
      SESSION_DRIVER: 'file' | 'memory';
      SESSION_NAME?: string;
      SESSION_RESAVE?: 'false' | 'true';
      SAVE_UNINITIALIZED?: 'true' | 'false';
      DB_USE_READ_WRITE_CLUSTER?: 'true' | 'false';
      ALLOWED_ORIGINS?: string;
      VIEW_TEMPLATE_CACHING?: 'true' | 'false';
      SESSION_SECURE_COOKIE?: 'true' | 'false';
    }
  }
}
