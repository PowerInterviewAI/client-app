/**
 * Environment utility functions
 */

export class EnvUtil {
  /**
   * Check if running in development mode
   */
  static isDev(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}
