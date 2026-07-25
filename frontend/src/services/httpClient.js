import { ApiConfig } from '../config/ApiConfig';

export async function traiterReponse(reponse) {
  if (reponse.status === 204) return null;

  const corps = await reponse.json();
  if (!reponse.ok) {
    const erreur = new Error(corps.message ?? ApiConfig.messageErreurHttpParDefaut(reponse.status));
    erreur.status = reponse.status;
    throw erreur;
  }
  return corps;
}
