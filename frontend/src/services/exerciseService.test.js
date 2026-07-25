import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listerExercices, creerExercice, mettreAJourTempo, supprimerExercice } from './exerciseService';
import { AuthConfig } from '../config/AuthConfig';

// Indice général : `fetch` est mocké globalement avec `vi.stubGlobal('fetch', vi.fn())`.
// Une "fausse réponse" minimale ressemble à : { ok: true, status: 200, json: async () => ({...}) }
// localStorage est le vrai `localStorage` de jsdom (pas mocké) : on peut y écrire directement avec
// localStorage.setItem(AuthConfig.TOKEN_STORAGE_KEY, 'un-token-de-test') pour contrôler le token lu par
// exerciseService.js, et localStorage.clear() dans un beforeEach pour repartir propre entre les tests.

beforeEach(() => {
  // TODO : localStorage.clear() + vi.stubGlobal('fetch', vi.fn())
});

describe('exerciseService', () => {
  it("envoie l'en-tête Authorization avec le token stocké", async () => {
    // TODO : localStorage.setItem(AuthConfig.TOKEN_STORAGE_KEY, 'abc123')
    // fetch.mockResolvedValue({ ok: true, status: 200, json: async () => [] })
    // await listerExercices()
    // Vérifier fetch appelé avec un 2e argument dont headers.Authorization === 'Bearer abc123'
    // (expect(fetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ headers: ... })))
  });

  it('retourne le corps JSON parsé quand la réponse est OK', async () => {
    // TODO : fetch.mockResolvedValue({ ok: true, status: 200, json: async () => [{ _id: '1', name: 'Paradiddle', current_tempo: 100 }] })
    // Vérifier que listerExercices() résout vers ce tableau
  });

  it("lance une erreur avec le message du corps JSON quand la réponse n'est pas OK", async () => {
    // TODO : fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ message: 'Tempo invalide' }) })
    // Vérifier await expect(creerExercice({...})).rejects.toThrow('Tempo invalide')
  });

  it('lance une erreur avec le message de fallback quand le corps JSON n\'a pas de message', async () => {
    // TODO : fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    // Vérifier le message de fallback (voir ApiConfig.messageErreurHttpParDefaut(500))
  });

  it('retourne null pour une réponse 204 (suppression)', async () => {
    // TODO : fetch.mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error('ne devrait pas être appelé') } })
    // Vérifier que supprimerExercice('1') résout vers null
  });
});
