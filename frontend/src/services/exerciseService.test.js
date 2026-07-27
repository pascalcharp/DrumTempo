import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listerExercices, creerExercice, mettreAJourTempo, supprimerExercice } from './exerciseService';
import { AuthConfig } from '../config/AuthConfig';
import {ApiConfig} from "@/config/ApiConfig.js";

beforeEach(() => {
  localStorage.clear() ;
  vi.stubGlobal('fetch', vi.fn()) ;
});

describe('exerciseService', () => {
  it("envoie l'en-tête Authorization avec le token stocké", async () => {
    localStorage.setItem(AuthConfig.TOKEN_STORAGE_KEY, 'abc123') ;
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => [] }) ;
    await listerExercices() ;
    expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem(AuthConfig.TOKEN_STORAGE_KEY),
          }
        })
    )
  });

  it('retourne le corps JSON parsé quand la réponse est OK', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => [{ _id: '1', name: 'Paradiddle', current_tempo: 100 }] }) ;
    const listResponse = await listerExercices() ;
    expect(listResponse).toEqual([{ _id: '1', name: 'Paradiddle', current_tempo: 100 }]) ;

  });

  it("lance une erreur avec le message du corps JSON quand la réponse n'est pas OK", async () => {
    fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ message: 'Tempo invalide' }) }) ;
    await expect(creerExercice({name: 'Paradiddle', current_tempo: 800})).rejects.toThrow('Tempo invalide')
  });

  it('lance une erreur avec le message de fallback quand le corps JSON n\'a pas de message', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    await expect(creerExercice({name: "Paradiddle", current_tempo: 100})).rejects.toThrow(ApiConfig.messageErreurHttpParDefaut(500)) ;
  });

  it('retourne null pour une réponse 204 (suppression)', async () => {
    fetch.mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error('ne devrait pas être appelé') } }) ;
    const supprimerResponse = await supprimerExercice(1) ;
    expect(supprimerResponse).toBeNull() ;
  });
});
