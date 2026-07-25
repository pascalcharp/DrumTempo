<script setup>
import { ref } from 'vue'

const props = defineProps({
  erreur: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['connexion', 'inscription'])
const modeToggler = {connexion: 'inscription', inscription: 'connexion'};

const mode = ref('connexion') // 'connexion' | 'inscription'
const email = ref('')
const motDePasse = ref('')

function basculerMode() {
  mode.value = modeToggler[mode.value]
}

function soumettre() {
  emit(mode.value, {email: email.value, password: motDePasse.value}) ;
}
</script>

<template>
  <form data-test="form-auth" class="formulaire-auth" @submit.prevent="soumettre">
    <h2>{{ mode === 'connexion' ? 'Connexion' : 'Inscription' }}</h2>

    <p v-if="erreur" data-test="msg-erreur-auth" class="erreur">{{ erreur }}</p>

    <input data-test="input-email" type="email" v-model="email" placeholder="Courriel" required />

    <input data-test="input-mot-de-passe" type="password" v-model="motDePasse" placeholder="Mot de passe" required />

    <button data-test="btn-submit-auth" type="submit">
      {{ mode === 'connexion' ? 'Se connecter' : "S'inscrire" }}
    </button>

    <button data-test="btn-toggle-mode" type="button" @click="basculerMode">
      {{ mode === 'connexion' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter' }}
    </button>
  </form>
</template>

<style scoped>
.formulaire-auth {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.erreur {
  color: #c0392b;
}
</style>
