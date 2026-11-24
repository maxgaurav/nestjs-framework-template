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

  describe('POST /oauth/refresh', () => {
    const refresh = (client: ClientModel, refreshToken: string) =>
      request(app.getHttpServer())
        .post('/oauth/refresh')
        .set('Accept', 'application/json')
        .send({
          refresh_token: refreshToken,
          client_id: client.id,
          client_secret: client.secret,
        });

    it('issues new tokens for an active client', () =>
      managedTransaction(app, async () => {
        const client = await clientFactory(app, GrantTypes.ImplicitPassword);
        const user = await userFactory(app, { password });
        const tokens = await passwordGrant(client, user).expect(
          HttpStatus.CREATED,
        );

        const response = await refresh(
          client,
          tokens.body.refresh_token as string,
        ).expect(HttpStatus.CREATED);
        expect(response.body.access_token).toEqual(expect.any(String));
      }));

    it('rejects a client revoked after the tokens were issued', () =>
      managedTransaction(app, async () => {
        const client = await clientFactory(app, GrantTypes.ImplicitPassword);
        const user = await userFactory(app, { password });
        const tokens = await passwordGrant(client, user).expect(
          HttpStatus.CREATED,
        );

        await app.get(ClientRepoService).revoke(client);

        await refresh(client, tokens.body.refresh_token as string).expect(
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }));
  });
});
