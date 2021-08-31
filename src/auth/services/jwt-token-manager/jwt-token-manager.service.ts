import { Injectable } from '@nestjs/common';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

@Injectable()
export class JwtTokenManagerService implements JwtOptionsFactory {
  constructor(private configService: ConfigService) {}

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
  protected keyPath(fileName: string): string {
    return join(process.cwd(), 'storage', fileName);
  }

  public async publicKey(): Promise<Buffer> {
    return fsPromises.readFile(this.keyPath('public-key.pem'));
  }

  public async privateKey(): Promise<Buffer> {
    return fsPromises.readFile(this.keyPath('private-key.pem'));
  }
}
