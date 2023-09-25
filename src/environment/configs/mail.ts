import { MailConfig } from '../environment-types.interface';
import { join } from 'path';

export const mailConfig = () => {
  const config: MailConfig = {
    driver: process.env.MAIL_DRIVER,
    template: {
      dir: join(process.cwd(), 'dist', 'view-engine', 'views', 'emails'),
      options: {
        strict: true,
      },
      inlineCssOptions: {
        url: ' ',
        preserveMediaQueries: true,
      },
    },
    options: {
      partials: {
        dir: join(
          process.cwd(),
          'dist',
          'view-engine',
          'views',
          'emails',
          'partials',
        ),
        options: {
          strict: true,
        },
      },
    },
  } as MailConfig;

  const fromName: string = process.env.MAIL_FROM_NAME || 'No Reply';
  const fromEmail: string =
    process.env.MAIL_FROM_EMAIL || 'noreply@nesttemplate';

  config.defaults = { from: { name: fromName, address: fromEmail } };
  return { mail: config };
};
