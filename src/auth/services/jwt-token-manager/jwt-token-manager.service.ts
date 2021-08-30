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
      publicKey: await fsPromises.readFile(this.keyPath('public-key.pem')),
      privateKey: await fsPromises.readFile(this.keyPath('private-key.pem')),
      signOptions: {
        expiresIn: '30 days',
      },
    };
  }

  /**
   * Returns key path for the file
   * @param fileName
   */
  public keyPath(fileName: string): string {
    return join(process.cwd(), 'storage', fileName);
  }
}
