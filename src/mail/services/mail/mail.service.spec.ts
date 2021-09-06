import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import * as HBS from 'hbs';
import { ConfigService } from '@nestjs/config';
import { HANDLEBAR_ENGINE } from '../../../view-engine/constants';
import { promises as fsPromises } from 'fs';
import { Buffer } from 'buffer';
import { ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';

describe('MailService', () => {
  let service: MailService;

  const mailer: MailerService = {
    sendMail: (value) => value,
  } as any;
  const handlebar: typeof HBS = {
    handlebars: { compile: (value) => value },
  } as any;
  const configService: ConfigService = {
    get: (value) => value,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: MailerService,
          useValue: mailer,
        },
        {
          provide: HANDLEBAR_ENGINE,
          useValue: handlebar,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return file content as buffer', async () => {
    const content = 'content';
    const configGetSpy = jest
      .spyOn(configService, 'get')
      .mockReturnValue({ viewPath: 'path' });

    const readFileSpy = jest
      .spyOn(fsPromises, 'readFile')
      .mockReturnValue(Promise.resolve(Buffer.from(content)));

    expect(await service.fileContent('test')).toEqual(Buffer.from('content'));
    expect(configGetSpy).toHaveBeenCalledWith('view');
    expect(readFileSpy).toHaveBeenCalledWith('path/test.hbs');
  });

  it('should render template and send mail', async () => {
    const templateParser = { template: (value) => value };
    const templateParserSpy = jest
      .spyOn(templateParser, 'template')
      .mockReturnValue('html');
    const compileSpy = jest
      .spyOn(handlebar.handlebars, 'compile')
      .mockReturnValue(templateParser.template);

    const content = 'content';

    const fileContentSpy = jest
      .spyOn(service, 'fileContent')
      .mockReturnValue(Promise.resolve(Buffer.from(content)));

    const sendMailSpy = jest
      .spyOn(mailer, 'sendMail')
      .mockReturnValue(Promise.resolve(true));

    const mailOptions: ISendMailOptions = {
      template: 'test',
      context: { test: 'test' },
      html: undefined,
    };

    expect(await service.sendMail(mailOptions)).toEqual(true);

    expect(fileContentSpy).toHaveBeenCalledWith('test');
    expect(compileSpy).toHaveBeenCalledWith(content);
    expect(templateParserSpy).toHaveBeenCalledWith(mailOptions.context);
    expect(sendMailSpy).toHaveBeenCalledWith({
      template: undefined,
      context: mailOptions.context,
      html: 'html',
    });
  });
});
