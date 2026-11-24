import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  JwtKeysMissingError,
  JwtTokenManagerService,
} from './jwt-token-manager.service.js';

describe('JwtTokenManagerService', () => {
  const service = new JwtTokenManagerService();
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'jwt-keys-'));
    vi.spyOn(service, 'keyPath').mockImplementation((file) => join(dir, file));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const writeKeyPair = () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    writeFileSync(join(dir, 'private-key.pem'), privateKey);
    writeFileSync(join(dir, 'public-key.pem'), publicKey);
  };

  it('returns the key pair with RS256 only for signing and verification', async () => {
    writeKeyPair();

    const options = await service.createJwtOptions();

    expect(String(options.privateKey as Buffer)).toContain('BEGIN PRIVATE KEY');
    expect(String(options.publicKey as Buffer)).toContain('BEGIN PUBLIC KEY');
    expect(options.signOptions).toEqual({ algorithm: 'RS256' });
    expect(options.verifyOptions).toEqual({ algorithms: ['RS256'] });
  });

  // Regression: missing keys used to be created as empty files, so tokens were "signed" with an
  // empty secret
  it('fails clearly when a key file is missing, without creating it', async () => {
    await expect(service.createJwtOptions()).rejects.toBeInstanceOf(
      JwtKeysMissingError,
    );
    await expect(service.privateKey()).rejects.toThrow(/oauth:generate-keys/);
  });

  it('fails clearly when a key file is empty', async () => {
    writeKeyPair();
    writeFileSync(join(dir, 'private-key.pem'), '  \n');

    await expect(service.createJwtOptions()).rejects.toBeInstanceOf(
      JwtKeysMissingError,
    );
  });
});
