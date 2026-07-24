import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthConfig } from '../config/AuthConfig';

// Fabrique un utilisateur authentifié directement en base (sans passer par /api/auth), pour que les
// tests de routes autres que auth puissent obtenir un token valide sans tester le flot d'auth à chaque fois.
export async function createAuthenticatedUser(email: string): Promise<{ userId: string; token: string }> {
  const user = await User.create({ email, passwordHash: 'motDePasseTemporaire123' });
  const userId = user._id.toString();
  const token = jwt.sign({ userId }, AuthConfig.JWT_SECRET, {
    expiresIn: AuthConfig.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  return { userId, token };
}
