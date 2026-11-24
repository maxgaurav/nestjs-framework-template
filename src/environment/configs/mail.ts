import { MailConfig } from '../environment-types.interface.js';

const MAIL_DRIVERS: MailConfig['driver'][] = ['smtp', 'log', 'memory'];

export const mailConfig = () => {
  const driver = (process.env.MAIL_DRIVER ?? 'log') as MailConfig['driver'];
  const username = process.env.MAIL_USERNAME;

  const config: MailConfig = {
    // An unknown driver falls back to `log`, which never delivers mail
    driver: MAIL_DRIVERS.includes(driver) ? driver : 'log',
    from: {
      name: process.env.MAIL_FROM_NAME || 'No Reply',
      // @nestjs/mail validates the sender at boot: it must be a full address with a TLD
      address:
        process.env.MAIL_FROM_ADDRESS ||
        process.env.MAIL_FROM_EMAIL ||
        'noreply@example.com',
    },
    retry: process.env.MAIL_RETRY ? parseInt(process.env.MAIL_RETRY, 10) : 3,
    smtp: {
      host: process.env.MAIL_SMTP_HOST || 'localhost',
      port: process.env.MAIL_SMTP_PORT
        ? parseInt(process.env.MAIL_SMTP_PORT, 10)
        : 1025,
      secure: process.env.MAIL_SMTP_SECURE === 'true',
      // JSON encoded node:tls options, e.g. {"rejectUnauthorized":false}
      tls: process.env.MAIL_SMTP_TLS
        ? (JSON.parse(process.env.MAIL_SMTP_TLS) as MailConfig['smtp']['tls'])
        : undefined,
      auth: username
        ? { user: username, pass: process.env.MAIL_PASSWORD ?? '' }
        : undefined,
    },
  };

  return { mail: config };
};
