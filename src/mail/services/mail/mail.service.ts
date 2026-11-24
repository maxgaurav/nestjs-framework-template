import { Injectable, Type } from '@nestjs/common';
import {
  type Mailable,
  type MailableRenderOptions,
  type MailableSendOptions,
  Mailer,
  MailMessage,
  type MailSendResult,
} from '@nestjs/mail';

/**
 * The app's entry point for sending mail. Feature code sends a Mailable class with its
 * recipients and data, and stays independent of the pre-1.0 @nestjs/mail API.
 *
 * Errors are not caught: `MailError.permanent` tells callers whether retrying is pointless.
 * To send only after a DB commit, send from a listener scheduled through
 * `EventRegisterCallbackService.registerEventCallBacks(callback, transaction)`.
 */
@Injectable()
export class MailService {
  constructor(private readonly mailer: Mailer) {}

  public send<M extends Mailable<any>>(
    mail: Type<M>,
    options: MailableSendOptions<Parameters<M['render']>[0]>,
  ): Promise<MailSendResult> {
    return this.mailer.send(mail, options);
  }

  /**
   * Builds the message without sending it, e.g. for previews
   */
  public render<M extends Mailable<any>>(
    mail: Type<M>,
    options: MailableRenderOptions<Parameters<M['render']>[0]>,
  ): Promise<MailMessage> {
    return this.mailer.render(mail, options);
  }
}
