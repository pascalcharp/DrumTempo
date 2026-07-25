import { beforeEach, describe, expect, it, vi } from 'vitest';
import { login, register } from './authService';

// Même indice que exerciseService.test.js : `fetch` mocké via vi.stubGlobal('fetch', vi.fn()),
// fausse réponse minimale { ok, status, json: async () => ({...}) }.

beforeEach(() => {
  // TODO : vi.stubGlobal('fetch', vi.fn())
});

describe('authService', () => {
  it('retourne le token à la connexion réussie', async () => {
    // TODO : fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ token: 'abc123' }) })
    // Vérifier que login({ email: '...', password: '...' }) résout vers { token: 'abc123' }
  });

  it('lance une erreur 401 avec identifiants invalides', async () => {
    // TODO : fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Identifiants invalides' }) })
    // Vérifier await expect(login({...})).rejects.toThrow('Identifiants invalides')
  });

  it("retourne l'utilisateur créé à l'inscription réussie", async () => {
    // TODO : fetch.mockResolvedValue({ ok: true, status: 201, json: async () => ({ _id: '1', email: '...' }) })
    // Vérifier que register({ email: '...', password: '...' }) résout vers ce corps
  });

  it('lance une erreur 409 si l\'email existe déjà', async () => {
    // TODO : fetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ message: 'Email déjà utilisé' }) })
    // Vérifier await expect(register({...})).rejects.toThrow('Email déjà utilisé')
  });
});
