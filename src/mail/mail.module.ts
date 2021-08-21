import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailConfigService } from './services/mail-config/mail-config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useClass: MailConfigService,
      imports: [ConfigModule],
    }),
  ],
  providers: [MailConfigService, ConfigService],
})
export class MailModule {}
