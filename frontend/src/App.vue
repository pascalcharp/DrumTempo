<script setup>
import {ref, computed, onMounted} from 'vue'
import ExerciseList from './components/ExerciseList.vue'
import ExerciseForm from './components/ExerciseForm.vue'
import LoginForm from './components/LoginForm.vue'
import {creerExercice, listerExercices, mettreAJourTempo, supprimerExercice,} from './services/exerciseService'
import {login, register} from './services/authService'
import {obtenirToken, stockerToken, effacerToken} from './services/tokenStorage'
import {TempoConfig} from "@/config/TempoConfig.js";

const exercices = ref([])
const erreur = ref(null)

const token = ref(obtenirToken())
const estConnecte = computed(() => token.value !== null)
const erreurAuth = ref(null)

// Appelée après une connexion réussie ET au montage si un token est déjà stocké (session persistée).
async function chargerExercices() {
  try {
    exercices.value = await listerExercices() ;
  }
  catch (error) {
    console.log(error) ;
    erreur.value = error.message ;
  }
}

// TODO : centralise la réaction à une erreur d'appel API. Utilisée dans tous les catch ci-dessous.
// Si error.status === 401 (token expiré/invalide) : effacer le token (effacerToken()), remettre
// token.value à null pour revenir à l'écran de connexion, réinitialiser exercices.value.
// Sinon : comportement actuel, erreur.value = error.message.
function gererErreurApi(error) {
  console.log(error) ;
  erreur.value = error.message ;
}

onMounted(async () => {
  if (estConnecte.value) await chargerExercices() ;
})

// TODO : appelle authService.login(identifiants), et au succès :
// stockerToken(reponse.token), token.value = reponse.token, erreurAuth.value = null, chargerExercices().
// À l'échec (catch) : erreurAuth.value = error.message (ne PAS utiliser gererErreurApi ici, l'écran de
// connexion n'est pas encore "dans l'app").
async function handleConnexion({email, password}) {

}

// TODO : appelle authService.register(identifiants). Décision à prendre : connexion automatique après
// inscription (réutiliser handleConnexion), ou affichage d'un message invitant à se connecter manuellement.
// À l'échec (ex: 409 email dupliqué) : erreurAuth.value = error.message.
async function handleInscription({email, password}) {

}

// TODO : effacerToken(), token.value = null, exercices.value = [] (retour à l'écran de connexion, aucune
// donnée de l'utilisateur précédent ne doit rester visible).
function handleDeconnexion() {

}

async function handleAjouter(nouvelExercice) {
  try {
    const nouveau = await creerExercice(nouvelExercice) ;
    exercices.value.push(nouveau) ;
  }
  catch (error) {
    gererErreurApi(error) ;
  }
}


async function handleAjustertempo(id, current, delta) {
  let newTempo = undefined ;
  if (current === null)  newTempo = TempoConfig.TEMPO_MIN ;
  else {
    newTempo = current + delta ;
    if (newTempo > TempoConfig.TEMPO_MAX) newTempo = TempoConfig.TEMPO_MAX ;
    else if (newTempo < TempoConfig.TEMPO_MIN)   newTempo = TempoConfig.TEMPO_MIN ;
  }
  try {
    const exerciceModifie = await mettreAJourTempo(id, newTempo) ;
    const index = exercices.value.findIndex(x => x._id === id) ;
    exercices.value[index] = exerciceModifie ;
  }
  catch (error) {
    gererErreurApi(error) ;
  }
}

async function handleSupprimer (id) {
  try{
    await supprimerExercice(id) ;
    exercices.value = exercices.value.filter(x => x._id !== id)
  }
  catch(error){
    gererErreurApi(error) ;
  }
}
</script>

<template>
  <main>
    <h1>DrumTempo</h1>

    <LoginForm
      v-if="!estConnecte"
      :erreur="erreurAuth"
      @connexion="handleConnexion"
      @inscription="handleInscription"
    />

    <template v-else>
      <button data-test="btn-deconnexion" type="button" @click="handleDeconnexion">Déconnexion</button>

      <p v-if="erreur" data-test="msg-erreur" class="erreur">{{ erreur }}</p>

      <ExerciseForm @ajouter="handleAjouter" />

      <ExerciseList :exercises="exercices" @supprimer="handleSupprimer" @ajuster-tempo="handleAjustertempo"/>
    </template>
  </main>
</template>

<style scoped>
.erreur {
  color: #c0392b;
}
</style>
