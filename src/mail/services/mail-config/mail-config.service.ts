import { Injectable } from '@nestjs/common';
import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MailConfig } from '../../../environment/environment-types.interface';
import MailMessage = require('nodemailer/lib/mailer/mail-message');

@Injectable()
export class MailConfigService implements MailerOptionsFactory {
  constructor(private configService: ConfigService) {}

  /**
   * @inheritDoc
   */
  createMailerOptions(): Promise<MailerOptions> | MailerOptions {
    const mailConfig = this.configService.get<MailConfig>('mail');

    switch (mailConfig.driver) {
      case 'smtp':
        mailConfig.transport = {
          host: this.configService.get('MAIL_SMTP_HOST', 'localhost'),
          port: this.configService.get('MAIL_SMTP_PORT', 1025),
          tls: JSON.parse(
            this.configService.get('MAIL_SMTP_TLS', JSON.stringify('')),
          ),
          secure:
            this.configService.get('MAIL_SMTP_SECURE', 'false') === 'true',
          auth: {
            user: this.configService.get('MAIL_USERNAME'),
            pass: this.configService.get('MAIL_PASSWORD'),
          },
        };
        break;

      case 'log':
      default:
        mailConfig.transport = {
          name: 'log',
          version: '1.0.0',
          send(
            mail: MailMessage<any>,
            callback: (err: Error | null, info: any) => void,
          ) {
            const input = mail.message.createReadStream();
            const envelope = mail.message.getEnvelope();
            const messageId = mail.message.messageId();
            input.pipe(process.stdout);
            input.on('end', function () {
              callback(null, {
                envelope,
                messageId,
              });
            });
          },
        };
    }

    return mailConfig;
  }
}
