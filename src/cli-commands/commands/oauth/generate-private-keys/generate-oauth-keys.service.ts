import { Injectable } from '@nestjs/common';
import { generateKeyPair } from 'node:crypto';
import { promises as fsPromises } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const generateRsaKeyPair = promisify(generateKeyPair);

export class OauthKeysExistError extends Error {
  constructor() {
    super(
      'JWT keys already exist in storage/. Use --force to replace them: every issued access and refresh token becomes invalid.',
    );
  }
}

export interface GenerateOauthKeysResult {
  privateKeyPath: string;
  publicKeyPath: string;
  replaced: boolean;
}

/**
 * Generates the RS256 key pair for bearer tokens. Pure file work (no app config, no database),
 * so it can run before the keys the app requires at boot exist.
 */
@Injectable()
export class GenerateOauthKeysService {
  public async generateKeys(force = false): Promise<GenerateOauthKeysResult> {
    const privateKeyPath = this.filePath('private-key.pem');
    const publicKeyPath = this.filePath('public-key.pem');
    const replaced =
      (await this.hasContent(privateKeyPath)) ||
      (await this.hasContent(publicKeyPath));

    if (replaced && !force) {
      throw new OauthKeysExistError();
    }

    const { publicKey, privateKey } = await generateRsaKeyPair('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      // Unencrypted PKCS#8: protected by file permissions (an empty passphrase adds nothing)
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    // Keys are never logged; the private key is readable by the owner only
    await fsPromises.writeFile(privateKeyPath, privateKey, { mode: 0o600 });
    await fsPromises.chmod(privateKeyPath, 0o600);
    await fsPromises.writeFile(publicKeyPath, publicKey, { mode: 0o644 });

    return { privateKeyPath, publicKeyPath, replaced };
  }

  public filePath(fileName: string): string {
    return join(process.cwd(), 'storage', fileName);
  }

  private async hasContent(filePath: string): Promise<boolean> {
    try {
      return (await fsPromises.readFile(filePath, 'utf8')).trim().length > 0;
    } catch {
      return false;
    }
  }
}
