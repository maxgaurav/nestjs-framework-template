import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { basicE2eSetup } from '../basic-e2e-setup.js';
import { SystemConfig } from '../../src/environment/environment-types.interface.js';
import { SessionProbeModule } from './session-probe.module.js';

describe('Sessions: stateless API routes, @UseSession() opt-in (e2e)', () => {
  let app: NestExpressApplication;
  let appOrigin: string;

  beforeAll(async () => {
    [app] = await basicE2eSetup({ rootModule: SessionProbeModule });
    appOrigin = new URL(
      app.get(ConfigService).getOrThrow<SystemConfig>('system').url,
    ).origin;
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  /** Starts a web session and returns its cookie */
  const webSessionCookie = async (): Promise<string> => {
    const response = await request(server())
      .get('/session-probe-web')
      .set('Accept', 'application/json')
      .expect(HttpStatus.OK);
    const cookie = response.headers['set-cookie'] as unknown as string[];
    expect(cookie).toBeDefined();
    return cookie.map((c) => c.split(';')[0]).join('; ');
  };

  it('gives versioned API routes no session and sets no cookie', async () => {
    const response = await request(server())
      .get('/api/v1/session-probe')
      .set('Accept', 'application/json')
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({ hasSession: false });
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('sets no cookie on the OAuth token endpoint', async () => {
    const response = await request(server())
      .post('/oauth/token')
      .set('Accept', 'application/json')
      .send({});

    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('keeps web routes on the session', async () => {
    const cookie = await webSessionCookie();

    const second = await request(server())
      .get('/session-probe-web')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(HttpStatus.OK);

    expect(second.body).toEqual({ visits: 2 });
  });

  // Regression: KillForApiInterceptor destroyed the session after any API call
  it('does not destroy a web session that calls an API route with its cookie', async () => {
    const cookie = await webSessionCookie();

    await request(server())
      .get('/api/v1/session-probe')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(HttpStatus.OK);

    const after = await request(server())
      .get('/session-probe-web')
      .set('Accept', 'application/json')
      .set('Cookie', cookie)
      .expect(HttpStatus.OK);
    expect(after.body).toEqual({ visits: 2 });
  });

  describe('@UseSession() API controller', () => {
    it('reads the web session', async () => {
      const cookie = await webSessionCookie();

      const response = await request(server())
        .get('/api/v1/session-probe-cookie')
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ hasSession: true, visits: 1 });
    });

    it('accepts a same-origin state-changing request', async () => {
      const cookie = await webSessionCookie();

      const response = await request(server())
        .post('/api/v1/session-probe-cookie')
        .set('Accept', 'application/json')
        .set('Origin', appOrigin)
        .set('Cookie', cookie)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({ visits: 2 });
    });

    it.each([
      ['a foreign Origin', { Origin: 'https://evil.example' }],
      ['no Origin or Referer', {}],
    ])(
      'rejects a state-changing request with %s (CSRF)',
      async (_label, headers) => {
        const cookie = await webSessionCookie();

        await request(server())
          .post('/api/v1/session-probe-cookie')
          .set('Accept', 'application/json')
          .set(headers as Record<string, string>)
          .set('Cookie', cookie)
          .expect(HttpStatus.FORBIDDEN);
      },
    );
  });
});
