import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { basicE2eSetup } from '../basic-e2e-setup';
import { TransactionProbeModule } from '../transaction/transaction-probe.module';

describe('Requests without a body (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    [app] = await basicE2eSetup({ rootModule: TransactionProbeModule });
  });

  afterAll(async () => {
    await app.close();
  });

  // Express 5 leaves req.body undefined when no body is sent; global interceptors must
  // not crash on it, so validation answers instead of a 500
  it('returns a validation error, not a server error, for a body-less POST', async () => {
    await request(app.getHttpServer())
      .post('/transaction-probe/users')
      .set('Accept', 'application/json')
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});
