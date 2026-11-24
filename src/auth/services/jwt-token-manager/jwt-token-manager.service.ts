import { Injectable } from '@nestjs/common';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { promises as fsPromises } from 'fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

export class JwtKeysMissingError extends Error {
  constructor(file: string) {
    super(
      `JWT key ${file} is missing or empty. Generate the key pair with: npm run app:command -- oauth:generate-keys`,
    );
  }
}

/**
 * Bearer tokens are RS256: signed with storage/private-key.pem, verified with
 * storage/public-key.pem, and only RS256 is accepted on verification (no algorithm confusion,
 * no unsigned tokens). Missing or empty keys stop the app at boot.
 */
@Injectable()
export class JwtTokenManagerService implements JwtOptionsFactory {
  async createJwtOptions(): Promise<JwtModuleOptions> {
    return {
      publicKey: await this.publicKey(),
      privateKey: await this.privateKey(),
      signOptions: { algorithm: 'RS256' },
      verifyOptions: { algorithms: ['RS256'] },
    };
  }

  /**
   * Returns key path for the file
   * @param fileName
   */
  public keyPath(fileName: string): string {
    return join(cwd(), 'storage', fileName);
  }

  /**
   * Reads a key file; fails with a clear message when it is missing or empty
   */
  public async readKey(fileName: string): Promise<Buffer> {
    const filePath = this.keyPath(fileName);
    let content: Buffer;
    try {
      content = await fsPromises.readFile(filePath);
    } catch {
      throw new JwtKeysMissingError(filePath);
    }
    if (content.toString('utf8').trim().length === 0) {
      throw new JwtKeysMissingError(filePath);
    }
    return content;
  }

  public publicKey(): Promise<Buffer> {
    return this.readKey('public-key.pem');
  }

  public privateKey(): Promise<Buffer> {
    return this.readKey('private-key.pem');
  }
}
