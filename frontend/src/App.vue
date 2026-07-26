<script setup>
import {ref, computed, onMounted} from 'vue'
import ExerciseList from './components/ExerciseList.vue'
import ExerciseForm from './components/ExerciseForm.vue'
import LoginForm from './components/LoginForm.vue'
import {creerExercice, listerExercices, mettreAJourTempo, supprimerExercice,} from './services/exerciseService'
import {login, register} from './services/authService'
import {obtenirToken, stockerToken, effacerToken} from './services/tokenStorage'
import {TempoConfig} from "@/config/TempoConfig.js";
import {AuthConfig} from "@/config/AuthConfig.js";

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


function gererErreurApi(error) {
  console.log(error) ;
  if (error.status === 401) {
    effacerToken() ;
    token.value = null ;
    exercices.value  = [] ;
    erreurAuth.value = AuthConfig.SESSION_EXPIREE_MESSAGE ;
  }
  else {
    erreur.value = error.message ;
  }
}

onMounted(async () => {
  if (estConnecte.value) await chargerExercices() ;
})


async function handleConnexion({email, password}) {
  try {
    const loginResponse = await login({ email, password }) ;
    stockerToken(loginResponse.token) ;
    token.value = loginResponse.token ;
    erreurAuth.value = null ;
    await chargerExercices() ;
  }
  catch (error) {
    console.log(error) ;
    erreurAuth.value = error.message ;
  }
}

async function handleInscription({email, password}) {
  try {
    await register({ email, password }) ;
    await handleConnexion({email, password}) ;
  }
  catch (error) {
    console.log(error) ;
    erreurAuth.value = error.message ;
  }
}


function handleDeconnexion() {
  effacerToken() ;
  token.value = null ;
  exercices.value = [] ;
  erreur.value = null ;
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
