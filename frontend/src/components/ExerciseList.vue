<script setup>
import { TempoConfig } from '../config/TempoConfig'

const props = defineProps({
  exercises: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['ajuster-tempo', 'supprimer'])

function ajusterTempo(selectedExerciseId, selectedExerciseTempo,  delta) {
  emit('ajuster-tempo', selectedExerciseId, selectedExerciseTempo, delta);
}

function supprimerExercice(selectedExerciseId) {
  emit('supprimer', selectedExerciseId)
}

</script>

<template>
  <ul class="liste-exercices">
    <li v-for="exercice in exercises" :key="exercice._id" class="exercice">
      <span class="nom">{{ exercice.name }}</span>

      <span class="tempo">{{ exercice.current_tempo ?? "-" }}</span>

      <button type="button" @click = "ajusterTempo(exercice._id,  exercice.current_tempo, -TempoConfig.TEMPO_STEP)" :disabled="exercice.current_tempo == null || exercice.current_tempo <= TempoConfig.TEMPO_MIN">-{{ TempoConfig.TEMPO_STEP }}</button>
      <button type="button" @click="ajusterTempo(exercice._id, exercice.current_tempo, TempoConfig.TEMPO_STEP)" :disabled="exercice.current_tempo != null && exercice.current_tempo >= TempoConfig.TEMPO_MAX">+{{ TempoConfig.TEMPO_STEP }}</button>

      <button type="button" class="supprimer" @click="supprimerExercice(exercice._id)">Supprimer</button>
    </li>
  </ul>
</template>

<style scoped>
.liste-exercices {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.exercice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.nom {
  flex: 1;
  font-weight: bold;
}

.tempo {
  min-width: 3ch;
  text-align: center;
}
</style>
