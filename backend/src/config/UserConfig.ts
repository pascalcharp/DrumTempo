export class UserConfig {
  static readonly EMAIL_MAX_LENGTH: number = 254;
  static readonly EMAIL_REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  static readonly PASSWORD_MIN_LENGTH: number = 8;

  static readonly MSG_SERVER_ERROR: string = 'Erreur serveur';
  static readonly MSG_VALIDATION_ERROR: string = 'Les données fournies ne respectent pas les critères de validation';
  static readonly MSG_EMAIL_DUPLICATE: string = 'Un compte existe déjà avec cet email';
  static readonly MSG_INVALID_CREDENTIALS: string = 'Email ou mot de passe invalide';
  static readonly MSG_PASSWORD_TOO_SHORT: string = `Le mot de passe doit contenir au moins ${UserConfig.PASSWORD_MIN_LENGTH} caractères`;
}
