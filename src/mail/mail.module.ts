import { Global, Module } from '@nestjs/common';
import { MailModule as NestMailModule } from '@nestjs/mail';
import { MailConfigService } from './services/mail-config/mail-config.service.js';
import { MailService } from './services/mail/mail.service.js';
import { TwigTemplateEngine } from './template-engines/twig-template-engine/twig-template-engine.js';
import { WelcomeMail } from './mailables/welcome/welcome.mail.js';

@Global()
@Module({
  imports: [
    NestMailModule.forRootAsync({
      useClass: MailConfigService,
      templates: TwigTemplateEngine,
    }),
  ],
  providers: [MailService, WelcomeMail],
  exports: [MailService],
})
export class MailModule {}
