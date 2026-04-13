/**
 * Random utility functions
 */

import { randomBytes, randomInt } from 'crypto';

export class RandomUtil {
  /**
   * Generate random integer between min and max (inclusive)
   */
  static int(min: number, max: number): number {
    return randomInt(min, max + 1);
  }

  /**
   * Generate random float between 0 and 1
   */
  static float(): number {
    return Math.random();
  }

  /**
   * Generate random string of specified length
   */
  static string(
    length: number,
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  ): string {
    const bytes = randomBytes(length);
    return Array.from(bytes)
      .map((byte) => charset[byte % charset.length])
      .join('');
  }

  /**
   * Generate random hex string
   */
  static hex(length: number): string {
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Pick random element from array
   */
  static choice<T>(array: T[]): T {
    return array[this.int(0, array.length - 1)];
  }

  /**
   * Shuffle array in place
   */
  static shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
