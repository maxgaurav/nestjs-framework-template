import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createHash, randomBytes } from 'node:crypto';
import { basicE2eSetup, managedTransaction } from '../basic-e2e-setup.js';
import { clientFactory } from '../factories/client.factory.js';
import { userFactory } from '../factories/user.factory.js';
import { GrantTypes } from '../../src/auth/grant-types/grant-type-implementation.js';
import { ClientModel } from '../../src/databases/models/oauth/client.model.js';

/**
 * The whole browser flow: authorize → email → password → redirect with code → token exchange.
 * Before this test existed, every step past the password page was broken.
 */
describe('Authorization code flow (e2e)', () => {
  let app: NestExpressApplication;
  const password = 'Secret-password-1';
  const redirectUrl = 'http://localhost:4200/callback';

  beforeAll(async () => {
    [app] = await basicE2eSetup();
  });

  afterAll(async () => {
    await app.close();
  });

  /** Runs the web login and returns the redirect back to the client */
  const loginForCode = async (
    client: ClientModel,
    email: string,
    extraQuery: Record<string, string> = {},
    grantType: GrantTypes = GrantTypes.AuthorizationCode,
  ) => {
    const browser = request.agent(app.getHttpServer());

    const loginPage = await browser
      .get('/oauth/authorization')
      .query({
        grant_type: grantType,
        client_id: client.id,
        redirect_url: redirectUrl,
        state: 'opaque-state-123',
        ...extraQuery,
      })
      .set('Accept', 'text/html')
      .expect(HttpStatus.OK);
    const token = /name="token" value="([^"]+)"/.exec(loginPage.text)?.[1];
    expect(token).toBeDefined();

    const emailStep = await browser
      .post('/oauth/authorization/password')
      .type('form')
      .set('Accept', 'text/html')
      .send({ token, email })
      .expect(HttpStatus.FOUND);

    const passwordPage = await browser
      .get(
        new URL(emailStep.headers['location'] as string, 'http://x').pathname +
          new URL(emailStep.headers['location'] as string, 'http://x').search,
      )
      .set('Accept', 'text/html')
      .expect(HttpStatus.OK);
    const passwordToken = /name="token" value="([^"]+)"/.exec(
      passwordPage.text,
    )?.[1];

    const login = await browser
      .post('/oauth/authorization/login')
      .type('form')
      .set('Accept', 'text/html')
      .send({ token: passwordToken, email, password })
      .expect(HttpStatus.FOUND);
    return new URL(login.headers['location'] as string);
  };

  const exchange = (
    client: ClientModel,
    code: string,
    secret = client.secret,
  ) =>
    request(app.getHttpServer())
      .post('/oauth/token')
      .set('Accept', 'application/json')
      .send({
        grant_type: GrantTypes.AuthorizationCode,
        code,
        client_id: client.id,
        client_secret: secret,
      });

  // Regression: `state` was read from the POST's query string and always came back empty
  it('redirects back to the client with a code and the original state', () =>
    managedTransaction(app, async () => {
      const client = await clientFactory(app, GrantTypes.AuthorizationCode);
      const user = await userFactory(app, { password });

      const callback = await loginForCode(client, user.email);

      expect(`${callback.origin}${callback.pathname}`).toEqual(redirectUrl);
      expect(callback.searchParams.get('code')).toEqual(expect.any(String));
      expect(callback.searchParams.get('state')).toEqual('opaque-state-123');
    }));

  // Regression: the challenge's client association was a class field, wiped after load (500)
  it('exchanges the code for tokens', () =>
    managedTransaction(app, async () => {
      const client = await clientFactory(app, GrantTypes.AuthorizationCode);
      const user = await userFactory(app, { password });
      const code = (await loginForCode(client, user.email)).searchParams.get(
        'code',
      )!;

      const response = await exchange(client, code).expect(HttpStatus.CREATED);
      expect(response.body).toEqual(
        expect.objectContaining({
          type: 'Bearer',
          access_token: expect.any(String),
          refresh_token: expect.any(String),
        }),
      );
    }));

  // Regression: a used code raised SequelizeEmptyResultError (500)
  it('rejects a code that was already used', () =>
    managedTransaction(app, async () => {
      const client = await clientFactory(app, GrantTypes.AuthorizationCode);
      const user = await userFactory(app, { password });
      const code = (await loginForCode(client, user.email)).searchParams.get(
        'code',
      )!;
      await exchange(client, code).expect(HttpStatus.CREATED);

      await exchange(client, code).expect(HttpStatus.UNPROCESSABLE_ENTITY);
    }));

  // Regression: only the client id was compared; the secret was never checked
  it('rejects the exchange with a wrong client secret', () =>
    managedTransaction(app, async () => {
      const client = await clientFactory(app, GrantTypes.AuthorizationCode);
      const user = await userFactory(app, { password });
      const code = (await loginForCode(client, user.email)).searchParams.get(
        'code',
      )!;

      await exchange(client, code, 'wrong-secret').expect(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }));

  it('rejects a code issued to another client', () =>
    managedTransaction(app, async () => {
      const client = await clientFactory(app, GrantTypes.AuthorizationCode);
      const other = await clientFactory(app, GrantTypes.AuthorizationCode);
      const user = await userFactory(app, { password });
      const code = (await loginForCode(client, user.email)).searchParams.get(
        'code',
      )!;

      await exchange(other, code).expect(HttpStatus.UNPROCESSABLE_ENTITY);
    }));

  describe('PKCE', () => {
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');

    const pkceCode = async () => {
      const client = await clientFactory(app, GrantTypes.PKCE);
      const user = await userFactory(app, { password });
      const callback = await loginForCode(
        client,
        user.email,
        { code_challenge: challenge, algorithm: 'sha256' },
        GrantTypes.PKCE,
      );
      return callback.searchParams.get('code')!;
    };

    const pkceExchange = (code: string, codeVerifier: string) =>
      request(app.getHttpServer())
        .post('/oauth/token')
        .set('Accept', 'application/json')
        .send({
          grant_type: GrantTypes.PKCE,
          code,
          code_verifier: codeVerifier,
        });

    // Regression: the challenge's user/client associations were wiped after load
    it('exchanges the code with the matching verifier', () =>
      managedTransaction(app, async () => {
        const response = await pkceExchange(await pkceCode(), verifier).expect(
          HttpStatus.CREATED,
        );
        expect(response.body.access_token).toEqual(expect.any(String));
      }));

    it('rejects a wrong verifier', () =>
      managedTransaction(app, async () => {
        await pkceExchange(
          await pkceCode(),
          randomBytes(32).toString('base64url'),
        ).expect(HttpStatus.UNPROCESSABLE_ENTITY);
      }));
  });
});
