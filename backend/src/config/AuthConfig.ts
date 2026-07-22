function requireJwtSecret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error(
      'JWT_SECRET manquant : copier backend/.env.example en backend/.env et définir une valeur.'
    );
  }
  return value;
}

export class AuthConfig {
  static readonly JWT_SECRET: string = requireJwtSecret();
  static readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? '1h';
  static readonly BCRYPT_SALT_ROUNDS: number = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);

  static readonly MSG_NO_TOKEN: string = 'Authentification requise';
  static readonly MSG_INVALID_TOKEN: string = 'Token invalide ou expiré';
  static readonly BEARER_PREFIX_LENGTH: number = 7 ;
}
