import { ApiConfig } from '../config/ApiConfig';

async function traiterReponse(reponse) {
  if (reponse.status === 204) return null;

  const corps = await reponse.json();
  if (!reponse.ok) {
    throw new Error(corps.message ?? `Erreur HTTP ${reponse.status}`);
  }
  return corps;
}

export async function listerExercices() {
  const reponse = await fetch(ApiConfig.EXERCISES_ENDPOINT);
  return traiterReponse(reponse);
}

export async function creerExercice({ name, current_tempo }) {
  const reponse = await fetch(ApiConfig.EXERCISES_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, current_tempo }),
  });
  return traiterReponse(reponse);
}

export async function mettreAJourTempo(id, current_tempo) {
  const reponse = await fetch(`${ApiConfig.EXERCISES_ENDPOINT}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_tempo }),
  });
  return traiterReponse(reponse);
}

export async function supprimerExercice(id) {
  const reponse = await fetch(`${ApiConfig.EXERCISES_ENDPOINT}/${id}`, {
    method: 'DELETE',
  });
  return traiterReponse(reponse);
}
