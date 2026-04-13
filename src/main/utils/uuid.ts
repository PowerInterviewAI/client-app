/**
 * UUID utility functions
 */

import { randomBytes } from 'crypto';

export class UuidUtil {
  /**
   * Generate a UUID v4
   */
  static generate(): string {
    const bytes = randomBytes(16);

    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = bytes.toString('hex');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join('-');
  }
}
