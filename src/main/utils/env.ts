export class EnvUtil {
  static isDev(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}
