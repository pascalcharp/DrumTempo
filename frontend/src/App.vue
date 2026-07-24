<script setup>
import {ref, onMounted} from 'vue'
import ExerciseList from './components/ExerciseList.vue'
import ExerciseForm from './components/ExerciseForm.vue'
import {creerExercice, listerExercices, mettreAJourTempo, supprimerExercice,} from './services/exerciseService'
import {TempoConfig} from "@/config/TempoConfig.js";

const exercices = ref([])
const erreur = ref(null)


onMounted( async () => {
  try {
    exercices.value = await listerExercices() ;
  }
  catch (error) {
    console.log(error) ;
    erreur.value = error.message ;
  }

}) ;

async function handleAjouter(nouvelExercice) {
  try {
    const nouveau = await creerExercice(nouvelExercice) ;
    exercices.value.push(nouveau) ;
  }
  catch (error) {
    console.log(error) ;
    erreur.value = error.message ;
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
    console.log(error) ;
    erreur.value = error.message ;
  }
}

async function handleSupprimer (id) {
  try{
    await supprimerExercice(id) ;
    exercices.value = exercices.value.filter(x => x._id !== id)
  }
  catch(error){
    console.log(error) ;
    erreur.value = error.message ;
  }
}
</script>

<template>
  <main>
    <h1>DrumTempo</h1>

    <p v-if="erreur" data-test="msg-erreur" class="erreur">{{ erreur }}</p>

    <ExerciseForm  @ajouter="handleAjouter" />

    <ExerciseList :exercises="exercices" @supprimer="handleSupprimer" @ajuster-tempo="handleAjustertempo"/>
  </main>
</template>

<style scoped>
.erreur {
  color: #c0392b;
}
</style>
