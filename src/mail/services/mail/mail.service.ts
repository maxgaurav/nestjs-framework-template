import { Inject, Injectable } from '@nestjs/common';
import * as HBS from 'hbs';
import { ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';
import { HANDLEBAR_ENGINE } from '../../../view-engine/constants';
import { MailerService } from '@nestjs-modules/mailer';
import { promises as fsPromises } from 'fs';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { ViewConfig } from '../../../environment/interfaces/environment-types.interface';
import { Buffer } from 'buffer';

@Injectable()
export class MailService {
  constructor(
    @Inject(HANDLEBAR_ENGINE) private hbs: typeof HBS,
    private mailer: MailerService,
    private configService: ConfigService,
  ) {}

  /**
   * Sends mail by compiling the template and sending it as body
   * @param sendMailOptions
   */
  public async sendMail(sendMailOptions: ISendMailOptions) {
    const template = await this.hbs.handlebars.compile(
      (await this.fileContent(sendMailOptions.template)).toString('utf8'),
    );
    sendMailOptions.template = undefined;
    sendMailOptions.html = template(sendMailOptions.context);
    return this.mailer.sendMail(sendMailOptions);
  }

  /**
   * Returns content of file
   * @param fileName
   */
  public async fileContent(fileName): Promise<Buffer> {
    const viewPath = this.configService.get<ViewConfig>('view');
    return fsPromises.readFile(join(viewPath.viewPath, `${fileName}.hbs`));
  }
}
