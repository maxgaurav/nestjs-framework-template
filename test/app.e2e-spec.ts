import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { basicE2eSetup } from './basic-e2e-setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    [app] = await basicE2eSetup();
  });

  it('/ (GET)', () => {
    const testRequest = request(app.getHttpServer()).get('/');

    return testRequest.expect((res) => {
      expect(res.text).toContain('Hello World!');
    });
  });
});
