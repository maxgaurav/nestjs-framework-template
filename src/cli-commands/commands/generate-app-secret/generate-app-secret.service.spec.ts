import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  chmodSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  AppSecretExistsError,
  GenerateAppSecretService,
  readAppSecret,
  upsertAppSecret,
} from './generate-app-secret.service.js';

describe('GenerateAppSecretService', () => {
  const service = new GenerateAppSecretService();
  let dir: string;
  let envFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'app-secret-'));
    envFile = join(dir, '.env');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('generates 64 random hex characters', () => {
    const secret = service.generate();
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(service.generate()).not.toEqual(secret);
  });

  it('adds the key when missing and keeps every other line', () => {
    writeFileSync(envFile, '# app\nAPP_PORT=3000\n\nDB_HOST=localhost\n');

    const result = service.writeToEnvFile(envFile, 'a'.repeat(64));

    expect(result).toEqual({ envFile, replaced: false, created: false });
    expect(readFileSync(envFile, 'utf8')).toEqual(
      `# app\nAPP_PORT=3000\n\nDB_HOST=localhost\nAPP_SECRET=${'a'.repeat(64)}\n`,
    );
  });

  it('fills an empty APP_SECRET in place', () => {
    writeFileSync(envFile, 'APP_PORT=3000\nAPP_SECRET=\nDB_HOST=x\n');

    service.writeToEnvFile(envFile, 'b'.repeat(64));

    expect(readFileSync(envFile, 'utf8')).toEqual(
      `APP_PORT=3000\nAPP_SECRET=${'b'.repeat(64)}\nDB_HOST=x\n`,
    );
  });

  it('refuses to replace an existing secret without force', () => {
    writeFileSync(envFile, 'APP_SECRET=keep-me\n');

    expect(() => service.writeToEnvFile(envFile, 'new')).toThrow(
      AppSecretExistsError,
    );
    expect(readFileSync(envFile, 'utf8')).toEqual('APP_SECRET=keep-me\n');
  });

  it('replaces an existing secret with force, keeping the file mode', () => {
    writeFileSync(envFile, 'A=1\nAPP_SECRET="old"\nB=2\n');
    chmodSync(envFile, 0o600);

    const result = service.writeToEnvFile(envFile, 'c'.repeat(64), true);

    expect(result.replaced).toBe(true);
    expect(readFileSync(envFile, 'utf8')).toEqual(
      `A=1\nAPP_SECRET=${'c'.repeat(64)}\nB=2\n`,
    );
    expect(statSync(envFile).mode & 0o777).toEqual(0o600);
  });

  it('creates the env file when it does not exist', () => {
    const result = service.writeToEnvFile(envFile, 'd'.repeat(64));

    expect(result.created).toBe(true);
    expect(readFileSync(envFile, 'utf8')).toEqual(
      `APP_SECRET=${'d'.repeat(64)}\n`,
    );
  });

  it('keeps Windows line endings', () => {
    expect(upsertAppSecret('A=1\r\nB=2\r\n', 'x')).toEqual(
      'A=1\r\nB=2\r\nAPP_SECRET=x\r\n',
    );
  });

  it.each([
    ['APP_SECRET=abc', 'abc'],
    ['APP_SECRET="abc"', 'abc'],
    ["  APP_SECRET = 'abc' ", 'abc'],
    ['APP_SECRET=', ''],
    ['OTHER=1', ''],
  ])('reads %s as %j', (text, expected) => {
    expect(readAppSecret(text)).toEqual(expected);
  });
});
