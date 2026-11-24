import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { basicE2eSetup, managedTransaction } from '../basic-e2e-setup.js';
import { clientFactory } from '../factories/client.factory.js';
import { GrantTypes } from '../../src/auth/grant-types/grant-type-implementation.js';

describe('GET /oauth/authorization (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    [app] = await basicE2eSetup();
  });

  afterAll(async () => {
    await app.close();
  });

  const authorize = (query: Record<string, string>) =>
    request(app.getHttpServer())
      .get('/oauth/authorization')
      .query(query)
      .set('Accept', 'text/html');

  const validQuery = (clientId: string) => ({
    grant_type: GrantTypes.AuthorizationCode,
    client_id: clientId,
    redirect_url: 'http://localhost:4200/callback',
  });

  it('shows the login page for a valid request', () =>
    managedTransaction(app, async () => {
      const client = await clientFactory(app, GrantTypes.AuthorizationCode);

      const response = await authorize(validQuery(client.id)).expect(
        HttpStatus.OK,
      );
      expect(response.text).toContain('<form');
    }));

  // Regression: the failed GET redirected to its own URL (recorded as "previous" before the
  // pipe ran), which a browser follows forever
  it('renders the problems instead of redirecting when parameters are missing', async () => {
    const response = await authorize({}).expect(HttpStatus.BAD_REQUEST);

    expect(response.headers['location']).toBeUndefined();
    expect(response.text).toContain(
      'data-testid="invalid-authorization-request"',
    );
    expect(response.text).toContain('client_id');
    expect(response.text).toContain('redirect_url');
  });

  // Regression: the client lookup ran on a non-UUID and Postgres failed the request (500)
  it('reports a malformed client id instead of failing', async () => {
    const response = await authorize(validQuery('not-a-uuid')).expect(
      HttpStatus.BAD_REQUEST,
    );

    expect(response.text).toContain('client_id must be a UUID');
  });

  it('does not redirect for an unknown client, even with an external referrer', async () => {
    const response = await authorize(validQuery(randomUUID()))
      .set('Referer', 'https://client.example/start')
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.headers['location']).toBeUndefined();
    expect(response.text).toContain('The client id is not valid');
  });

  it('answers JSON clients with the standard 422 validation format', async () => {
    const response = await request(app.getHttpServer())
      .get('/oauth/authorization')
      .set('Accept', 'application/json')
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body).toEqual(
      expect.objectContaining({
        errors: expect.objectContaining({ client_id: expect.any(Array) }),
      }),
    );
  });
});
