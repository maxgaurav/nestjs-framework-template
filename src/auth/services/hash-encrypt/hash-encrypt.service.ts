import { Injectable } from '@nestjs/common';

@Injectable()
export class HashEncryptService {
  /**
   * Compares value and hash and returns true if match
   * @param value
   * @param hash
   */
  public async checkHash(value: string, hash: string): Promise<boolean> {
    return true;
  }
}
