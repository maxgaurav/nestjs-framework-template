import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getModelToken } from '@nestjs/sequelize';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { basicE2eSetup, managedTransaction } from '../basic-e2e-setup.js';
import { userFactory } from '../factories/user.factory.js';
import { clientFactory } from '../factories/client.factory.js';
import { UserModel } from '../../src/databases/models/user.model.js';
import { AccessTokenModel } from '../../src/databases/models/oauth/access-token.model.js';
import { GrantTypes } from '../../src/auth/grant-types/grant-type-implementation.js';
import {
  TransactionProbeModule,
  TransactionProbeState,
} from './transaction-probe.module.js';

describe('E2E transaction setup (cls-hooked)', () => {
  let app: NestExpressApplication;
  let users: typeof UserModel;
  let state: TransactionProbeState;

  beforeAll(async () => {
    [app] = await basicE2eSetup({ rootModule: TransactionProbeModule });
    users = app.get<typeof UserModel>(getModelToken(UserModel));
    state = app.get(TransactionProbeState);
  });

  beforeEach(() => {
    state.committedEmails = [];
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets guards and validators see data created in the test transaction', async () => {
    const password = 'Secret-password-1';

    const email = await managedTransaction(app, async () => {
      // Created without passing a transaction: joins the test transaction via CLS
      const client = await clientFactory(app, GrantTypes.ImplicitPassword);
      const user = await userFactory(app, { password });

      const response = await request(app.getHttpServer())
        .post('/oauth/token')
        .set('Accept', 'application/json')
        .send({
          grant_type: GrantTypes.ImplicitPassword,
          client_id: client.id,
          client_secret: client.secret,
          email: user.email,
          password,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual(
        expect.objectContaining({
          type: 'Bearer',
          access_token: expect.any(String),
          refresh_token: expect.any(String),
        }),
      );

      // Written by the request's child transaction, visible to the parent
      expect(
        await app
          .get<typeof AccessTokenModel>(getModelToken(AccessTokenModel))
          .count({ where: { user_id: user.id } }),
      ).toEqual(1);

      return user.email;
    });

    // Everything was rolled back with the test transaction
    expect(await users.findOne({ where: { email } })).toBeNull();
  });

  it('commits the request child transaction into the test transaction and runs after-commit callbacks', async () => {
    const email = faker.internet.email().toLowerCase();

    await managedTransaction(app, async () => {
      await request(app.getHttpServer())
        .post('/transaction-probe/users')
        .set('Accept', 'application/json')
        .send({ email })
        .expect(HttpStatus.CREATED);

      expect(await users.findOne({ where: { email } })).not.toBeNull();
      expect(state.committedEmails).toEqual([email]);
    });

    expect(await users.findOne({ where: { email } })).toBeNull();
  });

  it('rolls back only the failed request, keeping earlier test data', async () => {
    const failedEmail = faker.internet.email().toLowerCase();

    await managedTransaction(app, async () => {
      const existing = await userFactory(app);

      await request(app.getHttpServer())
        .post('/transaction-probe/users')
        .set('Accept', 'application/json')
        .send({ email: failedEmail, fail: true })
        .expect(HttpStatus.BAD_REQUEST);

      expect(await users.findOne({ where: { email: failedEmail } })).toBeNull();
      expect(await users.findByPk(existing.id)).not.toBeNull();
      expect(state.committedEmails).toEqual([]);
    });
  });
});
