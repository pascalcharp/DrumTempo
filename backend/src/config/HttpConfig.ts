export class HttpConfig {
  static readonly JSON_BODY_LIMIT: string = '10kb';
  static readonly RATE_LIMIT_WINDOW_MS: number = 15 * 60 * 1000;
  static readonly RATE_LIMIT_MAX_REQUESTS: number = 100;
  static readonly MSG_TOO_MANY_REQUESTS: string = 'Trop de requêtes, réessayez plus tard';
}
