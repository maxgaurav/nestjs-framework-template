import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { createCipheriv, scrypt, createDecipheriv } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'util';
import { Buffer } from 'buffer';

@Injectable()
export class HashEncryptService implements OnApplicationBootstrap {
  protected saltRounds = 10;

  private ivBuffer: Buffer;

  private key: Buffer;

  constructor(private configService: ConfigService) {}

  public async onApplicationBootstrap(): Promise<void> {
    await this.configureConfig();
  }

  /**
   * Compares value and hash and returns true if match
   * @param value
   * @param hash
   */
  public async checkHash(value: string, hash: string): Promise<boolean> {
    return compare(value, hash);
  }

  /**
   * Returns hashed equivalent
   * @param value
   */
  public async createHash(value: string): Promise<string> {
    return hash(value, this.saltRounds);
  }

  /**
   * Encrypt content
   * @param token
   */
  public async encrypt(token: string): Promise<string> {
    const cipher = createCipheriv('aes-256-ctr', this.key, this.ivBuffer);
    let encryptedData = cipher.update(token, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    return encryptedData;
  }

  /**
   * Decrypt token
   * @param token
   */
  public async decrypt(token: string): Promise<string> {
    const decipher = createDecipheriv('aes-256-ctr', this.key, this.ivBuffer);
    let decryptData = decipher.update(token, 'hex', 'utf8');
    decryptData += decipher.final('utf8');
    return decryptData;
  }

  /**
   * Configure various buffer keys
   */
  public async configureConfig(): Promise<void> {
    const secret = this.configService.getOrThrow<string>('APP_SECRET');
    this.ivBuffer = Buffer.from(
      this.configService.get<string>('APP_ENCRYPT_HEX_KEY', '1bce5155bf46c13c'),
    );
    this.key = (await promisify(scrypt)(secret, 'salt', 32)) as Buffer;
  }
}
