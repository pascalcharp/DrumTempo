import { AuthConfig } from '../config/AuthConfig';
import { traiterReponse } from './httpClient';

export async function login({ email, password }) {
  const reponse = await fetch(AuthConfig.LOGIN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return traiterReponse(reponse);
}

export async function register({ email, password }) {
  const reponse = await fetch(AuthConfig.REGISTER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return traiterReponse(reponse);
}
