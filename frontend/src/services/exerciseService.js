import { ApiConfig } from '../config/ApiConfig';
import { traiterReponse } from './httpClient';
import { obtenirToken } from './tokenStorage';

function enTetesAuthentifies(enTetesSupplementaires = {}) {
  return {
    ...enTetesSupplementaires,
    Authorization: `Bearer ${obtenirToken()}`,
  };
}

export async function listerExercices() {
  const reponse = await fetch(ApiConfig.EXERCISES_ENDPOINT, {
    headers: enTetesAuthentifies(),
  });
  return traiterReponse(reponse);
}

export async function creerExercice({ name, current_tempo }) {
  const reponse = await fetch(ApiConfig.EXERCISES_ENDPOINT, {
    method: 'POST',
    headers: enTetesAuthentifies({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name, current_tempo }),
  });
  return traiterReponse(reponse);
}

export async function mettreAJourTempo(id, current_tempo) {
  const reponse = await fetch(`${ApiConfig.EXERCISES_ENDPOINT}/${id}`, {
    method: 'PATCH',
    headers: enTetesAuthentifies({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ current_tempo }),
  });
  return traiterReponse(reponse);
}

export async function supprimerExercice(id) {
  const reponse = await fetch(`${ApiConfig.EXERCISES_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: enTetesAuthentifies(),
  });
  return traiterReponse(reponse);
}
