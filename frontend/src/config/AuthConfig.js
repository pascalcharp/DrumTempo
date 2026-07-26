import { ApiConfig } from './ApiConfig';

export class AuthConfig {
  static LOGIN_ENDPOINT = `${ApiConfig.BASE_URL}/api/auth/login`;
  static REGISTER_ENDPOINT = `${ApiConfig.BASE_URL}/api/auth/register`;
  static TOKEN_STORAGE_KEY = 'drumtempo_token';
  static SESSION_EXPIREE_MESSAGE = 'Session expirée';
}
