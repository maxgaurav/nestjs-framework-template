import { createPublicKey, createPrivateKey } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  GenerateOauthKeysService,
  OauthKeysExistError,
} from './generate-oauth-keys.service.js';

describe('GenerateOauthKeysService', () => {
  const service = new GenerateOauthKeysService();
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'oauth-keys-'));
    vi.spyOn(service, 'filePath').mockImplementation((file) => join(dir, file));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes a usable RSA key pair, private key readable by the owner only', async () => {
    const result = await service.generateKeys();

    expect(result.replaced).toBe(false);
    const privateKey = createPrivateKey(readFileSync(result.privateKeyPath));
    const publicKey = createPublicKey(readFileSync(result.publicKeyPath));
    expect(privateKey.asymmetricKeyType).toEqual('rsa');
    expect(publicKey.asymmetricKeyType).toEqual('rsa');
    expect(statSync(result.privateKeyPath).mode & 0o777).toEqual(0o600);
  });

  it('fills empty key files without --force', async () => {
    writeFileSync(join(dir, 'private-key.pem'), '');
    writeFileSync(join(dir, 'public-key.pem'), '');

    await expect(service.generateKeys()).resolves.toEqual(
      expect.objectContaining({ replaced: false }),
    );
  });

  it('refuses to replace existing keys without force', async () => {
    await service.generateKeys();
    const before = readFileSync(join(dir, 'private-key.pem'), 'utf8');

    await expect(service.generateKeys()).rejects.toBeInstanceOf(
      OauthKeysExistError,
    );
    expect(readFileSync(join(dir, 'private-key.pem'), 'utf8')).toEqual(before);
  });

  it('replaces existing keys with force', async () => {
    await service.generateKeys();
    const before = readFileSync(join(dir, 'private-key.pem'), 'utf8');

    const result = await service.generateKeys(true);

    expect(result.replaced).toBe(true);
    expect(readFileSync(join(dir, 'private-key.pem'), 'utf8')).not.toEqual(
      before,
    );
  });
});
