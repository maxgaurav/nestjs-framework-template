import { HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { InMemoryDisk, Storage, StorageDisk } from '@nestjs/storage';
import request from 'supertest';
import { basicE2eSetup } from '../basic-e2e-setup.js';
import { StorageDisks } from '../../src/file-management/storage-disks.js';

describe('Signed file links (e2e)', () => {
  let app: NestExpressApplication;
  let disk: StorageDisk;
  const key = 'reports/2026/summary.txt';
  const content = 'hello signed world';

  /** Path + query of a signed URL, for supertest */
  const pathOf = (url: string) => {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  };

  beforeAll(async () => {
    [app] = await basicE2eSetup();
    disk = app.get(Storage).disk(StorageDisks.Private);
  });

  beforeEach(async () => {
    await disk.put(key, content, { contentType: 'text/plain' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  afterAll(async () => {
    await app.close();
  });

  it('uses in-memory disks in tests', () => {
    expect(disk).toBeInstanceOf(InMemoryDisk);
    expect(app.get(Storage).disk(StorageDisks.Public)).toBeInstanceOf(
      InMemoryDisk,
    );
  });

  it('downloads a file through a valid signed link', async () => {
    const url = await disk.signedUrl(key, { expiresIn: '5m' });

    const response = await request(app.getHttpServer())
      .get(pathOf(url))
      .expect(HttpStatus.OK);

    expect(response.text).toEqual(content);
    expect(response.headers['content-type']).toContain('text/plain');
  });

  it('supports range requests', async () => {
    const url = await disk.signedUrl(key, { expiresIn: '5m' });

    const response = await request(app.getHttpServer())
      .get(pathOf(url))
      .set('Range', 'bytes=0-4')
      .expect(HttpStatus.PARTIAL_CONTENT);

    expect(response.text).toEqual('hello');
  });

  it('rejects a tampered link', async () => {
    const url = new URL(await disk.signedUrl(key, { expiresIn: '5m' }));
    url.searchParams.set('key', 'reports/2026/other.txt');

    await request(app.getHttpServer())
      .get(pathOf(url.toString()))
      .expect(HttpStatus.FORBIDDEN);
  });

  it('rejects an expired link', async () => {
    const url = await disk.signedUrl(key, { expiresIn: '1m' });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 2 * 60 * 1000);

    await request(app.getHttpServer())
      .get(pathOf(url))
      .expect(HttpStatus.FORBIDDEN);
  });

  it('returns 404 for a signed link to a missing file', async () => {
    const url = await disk.signedUrl('reports/missing.txt', {
      expiresIn: '5m',
    });

    await request(app.getHttpServer())
      .get(pathOf(url))
      .expect(HttpStatus.NOT_FOUND);
  });

  it('returns 404 for a disk whose links this app does not serve', async () => {
    await request(app.getHttpServer())
      .get(`/files/${StorageDisks.Public}?key=${encodeURIComponent(key)}`)
      .expect(HttpStatus.NOT_FOUND);
  });
});
