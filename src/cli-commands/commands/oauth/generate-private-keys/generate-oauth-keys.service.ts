import { Injectable, Logger } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { generateKeyPair } from 'crypto';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { Buffer } from 'buffer';

@Injectable()
export class GenerateOauthKeysService {
  constructor(private log: Logger) {}

  @Command({
    command: 'oauth:generate-keys',
    describe: 'Generates private and public keys for jwt',
    autoExit: true,
  })
  public async generateKeys() {
    this.log.debug('Starting generation of keys');
    await new Promise((resolve, reject) => {
      generateKeyPair(
        'rsa',
        {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: '',
          },
        },
        async (err, publicKey, privateKey) => {
          if (!!err) {
            this.log.error(err, 'CliCommandModule');
            reject(err);
            return;
          }
          this.log.debug('Keys generated.', 'CliCommandModule');
          await Promise.all([
            this.savePrivateKey(privateKey),
            this.savePublicKey(publicKey),
          ]);

          resolve(true);
        },
      );
    });
  }

  /**
   * Saves file to disk
   * @param privateKey
   */
  public async savePrivateKey(privateKey: string): Promise<boolean> {
    this.log.debug('Private key generated', 'CliCommandModule');
    this.log.debug(privateKey, 'CliCommandModule');
    this.log.debug('Starting to write private key in file', 'CliCommandModule');
    const filePath = this.filePath('private-key.pem');
    await fsPromises.writeFile(filePath, Buffer.from(privateKey));
    this.log.debug(`Private key saved to file ${filePath}`, 'CliCommandModule');
    return true;
  }

  /**
   * Saves file to disk
   * @param publicKey
   */
  public async savePublicKey(publicKey: string): Promise<boolean> {
    this.log.debug('Public key generated', 'CliCommandModule');
    this.log.debug(publicKey, 'CliCommandModule');
    this.log.debug('Starting to write public key in file', 'CliCommandModule');
    const filePath = this.filePath('public-key.pem');
    await fsPromises.writeFile(filePath, Buffer.from(publicKey));
    this.log.debug(`Public key saved to file ${filePath}`, 'CliCommandModule');
    return true;
  }

  public filePath(fileName: string): string {
    return join(process.cwd(), 'storage', fileName);
  }
}
