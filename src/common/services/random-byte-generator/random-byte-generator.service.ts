import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Buffer } from 'buffer';

@Injectable()
export class RandomByteGeneratorService {
  /**
   * Generates secret string
   * @param size
   */
  public generateRandomByte(size = 40): Buffer {
    return randomBytes(size);
  }
}
