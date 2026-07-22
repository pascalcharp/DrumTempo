<script setup>
import { ref } from 'vue'

const emit = defineEmits(['ajouter'])

const nom = ref(null) ;
const tempo = ref(null) ;

function creerNouvelExercice() {
  emit('ajouter', {name: nom.value, current_tempo: (tempo.value === "") ? null : tempo.value }) ;
  nom.value = null ;
  tempo.value = null ;
}
</script>

<template>
  <form class="formulaire-ajout" @submit.prevent="creerNouvelExercice">

    <input type="text" v-model="nom" placeholder="Nom de l'exercice" required />

    <input type="number" v-model.number="tempo" placeholder="Tempo initial (optionnel)" />

    <button type="submit" >Ajouter</button>

  </form>
</template>

<style scoped>
.formulaire-ajout {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
</style>
