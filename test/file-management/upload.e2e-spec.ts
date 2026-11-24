import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Storage } from '@nestjs/storage';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { basicE2eSetup } from '../basic-e2e-setup.js';
import { StorageDisks } from '../../src/file-management/storage-disks.js';
import {
  PROBE_MAX_FILE_SIZE,
  UploadProbeModule,
} from './upload-probe.module.js';

// Smallest valid PNG: 1x1 transparent pixel
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const tempDir = join(process.cwd(), 'storage', 'uploads', 'tmp');
const tempFiles = () => readdirSync(tempDir).filter((f) => f !== '.gitignore');

describe('Uploads: nestjs-form-data validation + storage disk (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    [app] = await basicE2eSetup({ rootModule: UploadProbeModule });
  });

  afterAll(async () => {
    await app.close();
  });

  const upload = (content: Buffer, filename: string, contentType: string) =>
    request(app.getHttpServer())
      .post('/upload-probe')
      .set('Accept', 'application/json')
      .attach('file', content, { filename, contentType });

  it('stores a valid file on the disk under a generated key and cleans the temp file', async () => {
    const before = tempFiles().length;

    const response = await upload(PNG, 'my photo.png', 'image/png').expect(
      HttpStatus.CREATED,
    );

    expect(response.body).toEqual(
      expect.objectContaining({
        disk: StorageDisks.Public,
        contentType: 'image/png',
        size: PNG.length,
        key: expect.stringMatching(/^avatars\/[0-9a-f-]{36}\.png$/),
        url: expect.stringContaining('/storage/avatars/'),
      }),
    );
    const stored = await app
      .get(Storage)
      .disk(StorageDisks.Public)
      .getBuffer(response.body.key as string);
    expect(stored.equals(PNG)).toBe(true);
    expect(tempFiles().length).toEqual(before);
  });

  it('rejects content that only claims to be an image (magic bytes)', async () => {
    const response = await upload(
      Buffer.from('<svg onload="alert(1)"></svg>'),
      'evil.png',
      'image/png',
    ).expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body.errors.file).toEqual(
      expect.arrayContaining([expect.stringContaining('image/png')]),
    );
  });

  it('rejects files over the size limit', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(PROBE_MAX_FILE_SIZE)]);

    const response = await upload(big, 'big.png', 'image/png').expect(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response.body.errors.file).toBeDefined();
  });

  it('rejects a request without a file', async () => {
    await request(app.getHttpServer())
      .post('/upload-probe')
      .set('Accept', 'application/json')
      .field('other', 'value')
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});
