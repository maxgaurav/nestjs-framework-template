import { MailConfig } from '../interfaces/environment-types.interface';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

export const mailConfig = () => {
  console.log(join(process.cwd(), 'emails'));
  const config: MailConfig = {
    driver: process.env.MAIL_DRIVER,
    template: {
      dir: join(process.cwd(), 'emails'),
      adapter: new HandlebarsAdapter(undefined, {
        inlineCssEnabled: true,
      }),
      options: {
        strict: true,
      },
      inlineCssOptions: {
        url: ' ',
        preserveMediaQueries: true,
      },
    },
  } as MailConfig;

  const fromName: string = process.env.MAIL_FROM_NAME || 'No Reply';
  const fromEmail: string =
    process.env.MAIL_FROM_EMAIL || 'noreply@nesttemplate';

  config.defaults = { from: { name: fromName, address: fromEmail } };
  return { mail: config };
};
