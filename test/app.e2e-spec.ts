import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { basicE2eSetup } from './basic-e2e-setup.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    [app] = await basicE2eSetup();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    const testRequest = request(app.getHttpServer()).get('/');

    return testRequest.expect((res) => {
      expect(res.text).toContain('Hello World!');
    });
  });
});
