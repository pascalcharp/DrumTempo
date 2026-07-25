import { AuthConfig } from '../config/AuthConfig';

export function obtenirToken() {
  return localStorage.getItem(AuthConfig.TOKEN_STORAGE_KEY);
}

export function stockerToken(token) {
  localStorage.setItem(AuthConfig.TOKEN_STORAGE_KEY, token);
}

export function effacerToken() {
  localStorage.removeItem(AuthConfig.TOKEN_STORAGE_KEY);
}
