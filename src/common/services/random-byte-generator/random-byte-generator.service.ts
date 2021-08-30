import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

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
