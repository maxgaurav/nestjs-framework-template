import { ConfigService } from '@nestjs/config';
import { InMemoryMailTransport, MailTransport } from '@nestjs/mail';
import { NestExpressApplication } from '@nestjs/platform-express';
import { basicE2eSetup } from '../basic-e2e-setup.js';
import { MailService } from '../../src/mail/services/mail/mail.service.js';
import { WelcomeMail } from '../../src/mail/mailables/welcome/welcome.mail.js';
import { SystemConfig } from '../../src/environment/environment-types.interface.js';

describe('Mail (e2e)', () => {
  let app: NestExpressApplication;
  let mailService: MailService;
  let transport: InMemoryMailTransport;
  const recipient = 'someone@example.com';

  beforeAll(async () => {
    [app] = await basicE2eSetup();
    mailService = app.get(MailService);
    transport = app.get(MailTransport);
  });

  beforeEach(() => {
    transport.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('uses the in-memory transport in tests', () => {
    expect(transport).toBeInstanceOf(InMemoryMailTransport);
  });

  it('renders a mailable through the Twig views and sends it from the configured sender', async () => {
    const result = await mailService.send(WelcomeMail, {
      to: recipient,
      data: { message: 'Glad you are here' },
    });

    expect(result.messageId).toBeDefined();
    const sent = transport.assertSent({ to: recipient, subject: 'Welcome' });
    expect(sent.html).toContain('Message: Glad you are here');
    expect(sent.from.address).toEqual('noreply@example.com');
  });

  it('renders template functions (url) inside mail templates', async () => {
    await mailService.send(WelcomeMail, {
      to: recipient,
      data: { message: 'hi' },
    });

    const appUrl = app
      .get(ConfigService)
      .getOrThrow<SystemConfig>('system').url;
    const sent = transport.assertSent({ to: recipient });
    expect(sent.html).toContain(`href="${appUrl}`);
  });

  it('derives a plain-text part from the HTML', async () => {
    await mailService.send(WelcomeMail, {
      to: recipient,
      data: { message: 'plain text please' },
    });

    expect(transport.assertSent({ to: recipient }).text).toContain(
      'Message: plain text please',
    );
  });
});
