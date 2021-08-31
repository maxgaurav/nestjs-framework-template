import { Injectable } from '@nestjs/common';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

@Injectable()
export class JwtTokenManagerService implements JwtOptionsFactory {
  constructor() {}

  async createJwtOptions(): Promise<JwtModuleOptions> {
    return {
      publicKey: await this.publicKey(),
      privateKey: await this.privateKey(),
    };
  }

  /**
   * Returns key path for the file
   * @param fileName
   */
  public keyPath(fileName: string): string {
    return join(process.cwd(), 'storage', fileName);
  }

  /**
   * Returns public key content as buffer
   */
  public async publicKey(): Promise<Buffer> {
    return fsPromises.readFile(this.keyPath('public-key.pem'));
  }

  /**
   * Returns private key content as buffer
   */
  public async privateKey(): Promise<Buffer> {
    return fsPromises.readFile(this.keyPath('private-key.pem'));
  }
}
