import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';
import ExerciseList from './components/ExerciseList.vue';
import * as exerciseService from './services/exerciseService';
import { TempoConfig } from './config/TempoConfig';
import ExerciseForm from "@/components/ExerciseForm.vue";


// Remplace automatiquement chaque fonction exportée par exerciseService.js par un mock (vi.fn()) —
// aucun vrai appel réseau (fetch) n'est fait pendant ces tests.
vi.mock('./services/exerciseService');

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('charge et affiche les exercices au montage', async () => {

    exerciseService.listerExercices.mockResolvedValue([
      {_id: '1', name: 'Paradiddle', current_tempo: 100},
    ]) ;

    const wrapper = mount(App) ;
    await flushPromises() ;

    const exerciseListWrapper = wrapper.findAllComponents(ExerciseList) ;
    expect(exerciseListWrapper).toHaveLength(1) ;

    const exerciseList = exerciseListWrapper.at(0).props('exercises') ;
    expect(exerciseList).toHaveLength(1) ;
    expect(exerciseList).toEqual([
        {_id: '1',
          name: 'Paradiddle',
          current_tempo: 100
        },
    ]);
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    exerciseService.listerExercices.mockRejectedValue(new Error('Erreur réseau'))
    // mount(App), await flushPromises(), vérifier que le message d'erreur est affiché (wrapper.text())
    const wrapper = mount(App) ;
    await flushPromises() ;

    const messageErreurWrapper = wrapper.findAll('[data-test="msg-erreur"]') ;
    expect(messageErreurWrapper).toHaveLength(1) ;

    expect(messageErreurWrapper.at(0).text()).toBe('Erreur réseau') ;
  });

  it("ajoute un exercice à la liste quand ExerciseForm émet 'ajouter'", async () => {

    exerciseService.listerExercices.mockResolvedValue([]) ;
    exerciseService.creerExercice.mockResolvedValue({ _id: '2', name: 'Flam', current_tempo: null }) ;

    const wrapper = mount(App) ;
    await flushPromises() ;

    const exerciseListWrapper = wrapper.findAllComponents(ExerciseList) ;
    expect(exerciseListWrapper).toHaveLength(1) ;

    const exerciseList = exerciseListWrapper.at(0).props('exercises') ;
    expect(exerciseList).toEqual([]) ;

    const exerciseFormWrapper = wrapper.findAllComponents(ExerciseForm) ;
    expect(exerciseFormWrapper).toHaveLength(1) ;

    exerciseFormWrapper.at(0).vm.$emit('ajouter', {name: 'Flam', current_tempo: null}) ;
    await flushPromises() ;

    expect(exerciseService.creerExercice).toHaveBeenCalledWith({name: 'Flam', current_tempo: null}) ;

    const afterAddExerciseListWrapper = wrapper.findAllComponents(ExerciseList) ;
    expect(afterAddExerciseListWrapper).toHaveLength(1) ;

    const afterAddExerciseList = afterAddExerciseListWrapper.at(0).props('exercises') ;
    expect(afterAddExerciseList).toEqual([
        {_id: '2', name: 'Flam', current_tempo: null},
    ]) ;
  });

  it("part de current_tempo: null va directement à TEMPO_MIN (pas d'addition avec le delta)", async () => {
    exerciseService.listerExercices.mockResolvedValue([
      { _id: '1', name: 'Flam', current_tempo: null },
    ])
    exerciseService.mettreAJourTempo.mockResolvedValue({ _id: '1', name: 'Flam', current_tempo: TempoConfig.TEMPO_MIN }) ;
    const wrapper = mount(App) ;
    await flushPromises() ;

    const exerciseListWrapper = wrapper.findAllComponents(ExerciseList) ;
    expect(exerciseListWrapper).toHaveLength(1) ;

    const exerciseList = exerciseListWrapper.at(0).props('exercises') ;
    expect(exerciseList).toEqual([
        {_id: '1', name: 'Flam', current_tempo: null},
    ]) ;

    exerciseListWrapper.at(0).vm.$emit('ajuster-tempo', '1', null, TempoConfig.TEMPO_STEP) ;
    await flushPromises() ;

    expect(exerciseService.mettreAJourTempo).toHaveBeenCalledWith('1', TempoConfig.TEMPO_MIN) ;

    const afterIncrementExerciseWrapper = wrapper.findAllComponents(ExerciseList) ;
    expect(afterIncrementExerciseWrapper).toHaveLength(1) ;

    const afterIncrementExerciseList = afterIncrementExerciseWrapper.at(0).props('exercises') ;
    expect(afterIncrementExerciseList).toEqual([
      {_id: '1', name: 'Flam', current_tempo: TempoConfig.TEMPO_MIN},
    ]) ;

  });

  it("supprime un exercice quand ExerciseList émet 'supprimer'", async () => {
    exerciseService.listerExercices.mockResolvedValue([
      { _id: '1', name: 'Paradiddle', current_tempo: 100 },
    ])
    exerciseService.supprimerExercice.mockResolvedValue(null) ;
    const wrapper = mount(App) ;
    await flushPromises() ;

    const exerciseListWrapper = wrapper.findAllComponents(ExerciseList) ;
    expect(exerciseListWrapper).toHaveLength(1) ;

    const exerciseList = exerciseListWrapper.at(0).props('exercises') ;
    expect(exerciseList).toEqual([
      {_id: '1', name: 'Paradiddle', current_tempo: 100},
    ]) ;

    exerciseListWrapper.at(0).vm.$emit('supprimer', '1') ;
    await flushPromises() ;

    const afterDeletionExerciseListWrapper = wrapper.findAllComponents(ExerciseList) ;
    expect(afterDeletionExerciseListWrapper).toHaveLength(1) ;

    const afterDeletionExerciseList = afterDeletionExerciseListWrapper.at(0).props('exercises') ;
    expect(afterDeletionExerciseList).toEqual([]) ;

  });
});
