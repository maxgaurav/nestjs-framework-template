import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { basicE2eSetup, managedTransaction } from '../basic-e2e-setup.js';
import { userFactory } from '../factories/user.factory.js';
import { clientFactory } from '../factories/client.factory.js';
import { ClientModel } from '../../src/databases/models/oauth/client.model.js';
import { UserModel } from '../../src/databases/models/user.model.js';
import { ClientRepoService } from '../../src/auth/services/oauth/client-repo/client-repo.service.js';
import { GrantTypes } from '../../src/auth/grant-types/grant-type-implementation.js';
import { getModelToken } from '@nestjs/sequelize';
import { createHmac } from 'node:crypto';
import { AuthService } from '../../src/auth/services/auth/auth.service.js';
import { RefreshTokenRepoService } from '../../src/auth/services/oauth/refresh-token-repo/refresh-token-repo.service.js';
import { AccessTokenModel } from '../../src/databases/models/oauth/access-token.model.js';
import { AccessTokenRepoService } from '../../src/auth/services/oauth/access-token-repo/access-token-repo.service.js';

describe('OAuth token endpoints (e2e)', () => {
  let app: NestExpressApplication;
  const password = 'Secret-password-1';

  beforeAll(async () => {
    [app] = await basicE2eSetup();
  });

  afterAll(async () => {
    await app.close();
  });

  const passwordGrant = (client: ClientModel, user: UserModel) =>
    request(app.getHttpServer())
      .post('/oauth/token')
      .set('Accept', 'application/json')
      .send({
        grant_type: GrantTypes.ImplicitPassword,
        client_id: client.id,
        client_secret: client.secret,
        email: user.email,
        password,
      });

  describe('POST /oauth/token (password grant)', () => {
    it('issues tokens for an active password client and valid credentials', () =>
      managedTransaction(app, async () => {
        const client = await clientFactory(app, GrantTypes.ImplicitPassword);
        const user = await userFactory(app, { password });

        const response = await passwordGrant(client, user).expect(
          HttpStatus.CREATED,
        );
        expect(response.body).toEqual(
          expect.objectContaining({
            type: 'Bearer',
            access_token: expect.any(String),
            refresh_token: expect.any(String),
          }),
        );
      }));

    it('rejects a revoked client', () =>
      managedTransaction(app, async () => {
        const client = await clientFactory(app, GrantTypes.ImplicitPassword);
        await app.get(ClientRepoService).revoke(client);
        const user = await userFactory(app, { password });

        await passwordGrant(client, user).expect(
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }));

    it.each([GrantTypes.AuthorizationCode, GrantTypes.PKCE])(
      'rejects a client registered for the %s grant',
      (grantType) =>
        managedTransaction(app, async () => {
          const client = await clientFactory(app, grantType);
          const user = await userFactory(app, { password });

          await passwordGrant(client, user).expect(
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }),
    );

    it('rejects a wrong password', () =>
      managedTransaction(app, async () => {
        const client = await clientFactory(app, GrantTypes.ImplicitPassword);
        const user = await userFactory(app, { password: 'another-password' });

        await passwordGrant(client, user).expect(
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }));
  });

  // Regression: a class-field association (instead of `declare`) is re-initialised after
  // Sequelize's constructor and wipes the eager-loaded association
  it('loads an active access token with its client association', () =>
    managedTransaction(app, async () => {
      const client = await clientFactory(app, GrantTypes.ImplicitPassword);
      const user = await userFactory(app, { password });
      await passwordGrant(client, user).expect(HttpStatus.CREATED);

      const issued = await app
        .get<typeof AccessTokenModel>(getModelToken(AccessTokenModel))
        .findOne({ where: { user_id: user.id } });
      expect(issued).not.toBeNull();

      const active = await app
        .get(AccessTokenRepoService)
        .findForActiveState(issued!.id);
      expect(active?.client?.id).toEqual(client.id);
    }));

  describe('bearer token signatures', () => {
    const decodeHeader = (token: string) =>
      JSON.parse(
        Buffer.from(token.split('.')[0] ?? '', 'base64url').toString(),
      ) as { alg: string };

    it('issues RS256 access and refresh tokens', () =>
      managedTransaction(app, async () => {
        const client = await clientFactory(app, GrantTypes.ImplicitPassword);
        const user = await userFactory(app, { password });
        const response = await passwordGrant(client, user).expect(
          HttpStatus.CREATED,
        );

        expect(decodeHeader(response.body.access_token as string).alg).toEqual(
          'RS256',
        );
        expect(decodeHeader(response.body.refresh_token as string).alg).toEqual(
          'RS256',
        );
      }));

    // Regression: tokens were signed HS256 with the (empty) private key file as the secret, so
    // anyone could produce a valid signature
    it('rejects a token signed HS256 with an empty secret', () =>
      managedTransaction(app, async () => {
        const client = await clientFactory(app, GrantTypes.ImplicitPassword);
        const user = await userFactory(app, { password });
        await passwordGrant(client, user).expect(HttpStatus.CREATED);
        const issued = await app
          .get<typeof AccessTokenModel>(getModelToken(AccessTokenModel))
          .findOne({ where: { user_id: user.id } });

        const encode = (value: object | string) =>
          Buffer.from(
            typeof value === 'string' ? value : JSON.stringify(value),
          ).toString('base64url');
        const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(issued!.id)}`;
        const forged = `${unsigned}.${createHmac('sha256', '').update(unsigned).digest('base64url')}`;

        await expect(
          app.get(AuthService).findUserByToken(forged),
        ).rejects.toThrow();
      }));
  });

  describe('POST /oauth/token (refresh_token grant)', () => {
    const DAY = 24 * 60 * 60 * 1000;

    const refreshGrant = (client: ClientModel, refreshToken: string) =>
      request(app.getHttpServer())
        .post('/oauth/token')
        .set('Accept', 'application/json')
        .send({
          grant_type: GrantTypes.RefreshToken,
          refresh_token: refreshToken,
          client_id: client.id,
          client_secret: client.secret,
        });

    const issueTokens = async () => {
      const client = await clientFactory(app, GrantTypes.ImplicitPassword);
      const user = await userFactory(app, { password });
      const response = await passwordGrant(client, user).expect(
        HttpStatus.CREATED,
      );
      return {
        client,
        user,
        accessToken: response.body.access_token as string,
        refreshToken: response.body.refresh_token as string,
      };
    };

    const accessTokens = () =>
      app.get<typeof AccessTokenModel>(getModelToken(AccessTokenModel));

    it('issues a new token pair', () =>
      managedTransaction(app, async () => {
        const { client, refreshToken } = await issueTokens();

        const response = await refreshGrant(client, refreshToken).expect(
          HttpStatus.CREATED,
        );

        expect(response.body).toEqual(
          expect.objectContaining({
            type: 'Bearer',
            access_token: expect.any(String),
            refresh_token: expect.any(String),
          }),
        );
        expect(response.body.refresh_token).not.toEqual(refreshToken);
      }));

    it('rotates: the used refresh token and its access token stop working', () =>
      managedTransaction(app, async () => {
        const { client, user, refreshToken } = await issueTokens();
        await refreshGrant(client, refreshToken).expect(HttpStatus.CREATED);

        await refreshGrant(client, refreshToken).expect(
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
        // only the new access token is left for the user
        expect(
          await accessTokens().count({ where: { user_id: user.id } }),
        ).toEqual(1);
      }));

    // Regression: consumeToken gave the access token the refresh lifetime and vice versa
    it('gives the new tokens their own lifetimes', () =>
      managedTransaction(app, async () => {
        const { client, user, refreshToken } = await issueTokens();
        await refreshGrant(client, refreshToken).expect(HttpStatus.CREATED);

        const accessToken = await accessTokens().findOne({
          where: { user_id: user.id },
        });
        const newRefresh = await app
          .get(RefreshTokenRepoService)
          .refreshToken.findOne({
            where: { access_token_id: accessToken!.id },
          });

        const accessLifetime =
          new Date(accessToken!.expires_at!).getTime() - Date.now();
        const refreshLifetime =
          new Date(newRefresh!.expires_at!).getTime() - Date.now();
        expect(Math.round(accessLifetime / DAY)).toEqual(30);
        expect(Math.round(refreshLifetime / DAY)).toEqual(60);
      }));

    // Regression: a refresh token could be redeemed with any client's credentials
    it('rejects a refresh token presented by another client', () =>
      managedTransaction(app, async () => {
        const { refreshToken } = await issueTokens();
        const otherClient = await clientFactory(
          app,
          GrantTypes.ImplicitPassword,
        );

        await refreshGrant(otherClient, refreshToken).expect(
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }));

    it('rejects a client revoked after the tokens were issued', () =>
      managedTransaction(app, async () => {
        const { client, refreshToken } = await issueTokens();
        await app.get(ClientRepoService).revoke(client);

        await refreshGrant(client, refreshToken).expect(
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }));

    it('rejects a malformed or forged refresh token without a server error', () =>
      managedTransaction(app, async () => {
        const { client } = await issueTokens();

        await refreshGrant(client, 'not-a-jwt').expect(
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }));

    it('requires the refresh token for this grant', () =>
      managedTransaction(app, async () => {
        const { client } = await issueTokens();

        const response = await request(app.getHttpServer())
          .post('/oauth/token')
          .set('Accept', 'application/json')
          .send({
            grant_type: GrantTypes.RefreshToken,
            client_id: client.id,
            client_secret: client.secret,
          })
          .expect(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response.body.errors.refresh_token).toBeDefined();
      }));

    it('no longer serves the dedicated POST /oauth/refresh endpoint', async () => {
      await request(app.getHttpServer())
        .post('/oauth/refresh')
        .set('Accept', 'application/json')
        .send({})
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
