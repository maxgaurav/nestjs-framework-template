import { Injectable } from '@nestjs/common';
import type { Mailable, MailTemplateContent } from '@nestjs/mail';

export interface WelcomeMailData {
  message: string;
}

/**
 * Sample Mailable: one class per email, rendering a Twig template from `views/`
 */
@Injectable()
export class WelcomeMail implements Mailable<WelcomeMailData> {
  render(data: WelcomeMailData): MailTemplateContent {
    return {
      subject: 'Welcome',
      template: 'emails/welcome',
      context: data,
    };
  }
}
