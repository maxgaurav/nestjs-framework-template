import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InMemoryMailTransport,
  LogMailTransport,
  type MailModuleOptions,
  type MailOptionsFactory,
  type MailTransport,
  SmtpTransport,
} from '@nestjs/mail';
import { MailConfig } from '../../../environment/environment-types.interface.js';

/**
 * Builds the @nestjs/mail options from the `mail` config (MAIL_* env vars)
 */
@Injectable()
export class MailConfigService implements MailOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createMailOptions(): MailModuleOptions {
    const mail = this.configService.getOrThrow<MailConfig>('mail');
    return {
      transport: this.createTransport(mail),
      from: mail.from,
      retry: mail.retry,
    };
  }

  protected createTransport(mail: MailConfig): MailTransport {
    switch (mail.driver) {
      case 'smtp':
        return new SmtpTransport(mail.smtp);
      case 'memory':
        // Tests: inspect sent mail with assertSent()/find()
        return new InMemoryMailTransport();
      case 'log':
        // Local development: prints the rendered message, delivers nothing
        return new LogMailTransport({ body: true });
    }
  }
}
