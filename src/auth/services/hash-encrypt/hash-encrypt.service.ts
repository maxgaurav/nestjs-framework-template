import { Injectable } from '@nestjs/common';
import { hash, compare } from 'bcrypt';

@Injectable()
export class HashEncryptService {
  protected saltRounds = 10;

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
}
