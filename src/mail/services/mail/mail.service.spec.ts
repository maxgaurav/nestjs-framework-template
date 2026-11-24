import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import * as Twig from 'twig';
import { ConfigService } from '@nestjs/config';
import { VIEW_RENDER_ENGINE } from '../../../view-engine/constants';
import { ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';

describe('MailService', () => {
  let service: MailService;

  const mailer: MailerService = {
    sendMail: (value) => value,
  } as any;
  const twigTemplateEngine: typeof Twig = {
    renderFile: (value) => value,
  } as any;
  const configService: ConfigService = {
    getOrThrow: (value) => value,
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
          provide: VIEW_RENDER_ENGINE,
          useValue: twigTemplateEngine,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return file content as string', async () => {
    const configGetSpy = vi
      .spyOn(configService, 'getOrThrow')
      .mockReturnValue({ viewPath: 'path' });
    const renderSpy = vi
      .spyOn(twigTemplateEngine, 'renderFile')
      .mockImplementation((...params: any[]) => {
        if (params.length !== 3) {
          throw new Error('invalid number of arguments');
        }

        params[2](null, 'sample');
      });

    expect(await service.fileContent('test', { content: 'any' })).toEqual(
      'sample',
    );

    expect(configGetSpy).toHaveBeenCalledWith('view');
    expect(renderSpy).toHaveBeenCalledWith(
      'path/test.twig',
      { content: 'any' },
      expect.anything(),
    );
  });

  it('should render template and send mail', async () => {
    const fileContentSpy = vi
      .spyOn(service, 'fileContent')
      .mockReturnValue(Promise.resolve('sample'));
    const sendMailSpy = vi
      .spyOn(mailer, 'sendMail')
      .mockReturnValue(Promise.resolve(true));

    const mailOptions: ISendMailOptions = {
      template: 'test',
      context: { test: 'test' },
      html: undefined,
    };

    expect(await service.sendMail(mailOptions)).toEqual(true);
    expect(fileContentSpy).toHaveBeenCalledWith('test', mailOptions.context);

    expect(sendMailSpy).toHaveBeenCalledWith({
      template: undefined,
      context: mailOptions.context,
      html: 'sample',
    });
  });
});
