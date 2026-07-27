import { beforeEach, describe, expect, it, vi } from 'vitest';
import { login, register } from './authService';

// Même indice que exerciseService.test.js : `fetch` mocké via vi.stubGlobal('fetch', vi.fn()),
// fausse réponse minimale { ok, status, json: async () => ({...}) }.

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
});

describe('authService', () => {
  it('retourne le token à la connexion réussie', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ token: 'abc123' }) }) ;
    const loginResponse = await login({email: 'good@user.com', password: '0123456789'}) ;
    expect(loginResponse).toEqual({ token: 'abc123' }) ;
  });

  it('lance une erreur 401 avec identifiants invalides', async () => {
    fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Identifiants invalides' }) }) ;
    await expect(login({email: 'bad@user.com', password: '0123456789'})).rejects.toMatchObject({ message: 'Identifiants invalides', status: 401 }) ;
  });

  it("retourne l'utilisateur créé à l'inscription réussie", async () => {
    fetch.mockResolvedValue({ ok: true, status: 201, json: async () => ({ _id: '1', email: 'good@user.com' }) })  ;
    const registerResponse = await register({email: 'good@user.com', password: '0123456789'}) ;
    expect(registerResponse).toEqual({ _id: '1',  email: 'good@user.com' }) ;
  });

  it('lance une erreur 409 si l\'email existe déjà', async () => {
    fetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ message: 'Email déjà utilisé' }) }) ;
    await expect(register({email: 'dupl@email.com', password: '0123456789'})).rejects.toMatchObject({message: 'Email déjà utilisé', status: 409}) ;

  });
});
