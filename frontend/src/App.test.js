import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';
import ExerciseList from './components/ExerciseList.vue';
import * as exerciseService from './services/exerciseService';
import { TempoConfig } from './config/TempoConfig';

// Remplace automatiquement chaque fonction exportée par exerciseService.js par un mock (vi.fn()) —
// aucun vrai appel réseau (fetch) n'est fait pendant ces tests.
vi.mock('./services/exerciseService');

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('charge et affiche les exercices au montage', async () => {
    // TODO : exerciseService.listerExercices.mockResolvedValue([
    //   { _id: '1', name: 'Paradiddle', current_tempo: 100 },
    // ])
    // const wrapper = mount(App)
    // await flushPromises()  -- onMounted() est asynchrone, il faut attendre sa résolution
    // Vérifier que "Paradiddle" apparaît dans wrapper.text()
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    // TODO : exerciseService.listerExercices.mockRejectedValue(new Error('Erreur réseau'))
    // mount(App), await flushPromises(), vérifier que le message d'erreur est affiché (wrapper.text())
  });

  it("ajoute un exercice à la liste quand ExerciseForm émet 'ajouter'", async () => {
    // TODO : exerciseService.listerExercices.mockResolvedValue([])
    //        exerciseService.creerExercice.mockResolvedValue({ _id: '2', name: 'Flam', current_tempo: null })
    // mount(App), await flushPromises()
    // Indice : wrapper.findComponent({ name: 'ExerciseForm' }).vm.$emit('ajouter', { name: 'Flam', current_tempo: null })
    // await flushPromises() à nouveau, puis vérifier "Flam" dans wrapper.text()
    // et que exerciseService.creerExercice a été appelé (expect(...).toHaveBeenCalledWith(...))
  });

  it("part de current_tempo: null va directement à TEMPO_MIN (pas d'addition avec le delta)", async () => {
    // TODO : exerciseService.listerExercices.mockResolvedValue([
    //   { _id: '1', name: 'Flam', current_tempo: null },
    // ])
    // exerciseService.mettreAJourTempo.mockResolvedValue({ _id: '1', name: 'Flam', current_tempo: TempoConfig.TEMPO_MIN })
    // mount(App), await flushPromises()
    // Indice : wrapper.findComponent(ExerciseList).vm.$emit('ajuster-tempo', '1', null, TempoConfig.TEMPO_STEP)
    // await flushPromises()
    // Vérifier exerciseService.mettreAJourTempo appelé avec ('1', TempoConfig.TEMPO_MIN) — pas avec un delta
    // ajouté à null (voir la décision UX documentée dans DEVLOG à l'Étape 4)
  });

  it("supprime un exercice quand ExerciseList émet 'supprimer'", async () => {
    // TODO : exerciseService.listerExercices.mockResolvedValue([
    //   { _id: '1', name: 'Paradiddle', current_tempo: 100 },
    // ])
    // exerciseService.supprimerExercice.mockResolvedValue(null)
    // mount(App), await flushPromises()
    // wrapper.findComponent(ExerciseList).vm.$emit('supprimer', '1')
    // await flushPromises()
    // Vérifier que "Paradiddle" n'apparaît plus dans wrapper.text()
  });
});
