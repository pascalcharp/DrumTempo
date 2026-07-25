import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';
import ExerciseList from './components/ExerciseList.vue';
import LoginForm from './components/LoginForm.vue';
import * as exerciseService from './services/exerciseService';
import * as authService from './services/authService';
import * as tokenStorage from './services/tokenStorage';
import { TempoConfig } from './config/TempoConfig';
import ExerciseForm from "@/components/ExerciseForm.vue";


// Remplace automatiquement chaque fonction exportée par exerciseService.js/authService.js/tokenStorage.js
// par un mock (vi.fn()) — aucun vrai appel réseau (fetch) ni vrai accès à localStorage pendant ces tests.
vi.mock('./services/exerciseService');
vi.mock('./services/authService');
vi.mock('./services/tokenStorage');

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Par défaut, les tests ci-dessous supposent une session déjà active (comme avant l'introduction de
    // l'authentification). Les tests spécifiques à l'écran de connexion (plus bas) écrasent ce mock avec
    // tokenStorage.obtenirToken.mockReturnValue(null).
    tokenStorage.obtenirToken.mockReturnValue('token-de-test');
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

  it("affiche LoginForm quand aucun token n'est stocké", async () => {
    // TODO : tokenStorage.obtenirToken.mockReturnValue(null)
    // mount(App), await flushPromises()
    // Vérifier wrapper.findAllComponents(LoginForm) a une longueur de 1
    // Vérifier wrapper.findAllComponents(ExerciseList) a une longueur de 0
    // Vérifier que exerciseService.listerExercices n'a PAS été appelé (pas de fuite de données sans session)
  });

  it('se connecte avec succès : stocke le token et charge les exercices', async () => {
    // TODO : tokenStorage.obtenirToken.mockReturnValue(null)
    // authService.login.mockResolvedValue({ token: 'nouveau-token' })
    // exerciseService.listerExercices.mockResolvedValue([])
    // mount(App), await flushPromises()
    // wrapper.findComponent(LoginForm).vm.$emit('connexion', { email: '...', password: '...' })
    // await flushPromises()
    // Vérifier tokenStorage.stockerToken appelé avec 'nouveau-token'
    // Vérifier wrapper.findAllComponents(ExerciseList) a maintenant une longueur de 1
  });

  it("affiche l'erreur de connexion sur échec (identifiants invalides)", async () => {
    // TODO : tokenStorage.obtenirToken.mockReturnValue(null)
    // authService.login.mockRejectedValue(new Error('Identifiants invalides'))
    // mount(App), await flushPromises()
    // wrapper.findComponent(LoginForm).vm.$emit('connexion', { email: '...', password: '...' })
    // await flushPromises()
    // Vérifier que LoginForm reçoit la prop erreur === 'Identifiants invalides'
    // Vérifier que LoginForm est toujours affiché (pas de connexion)
  });

  it('se déconnecte et revient à l\'écran de connexion', async () => {
    // TODO : exerciseService.listerExercices.mockResolvedValue([])
    // mount(App), await flushPromises() — session déjà active (mock par défaut du beforeEach)
    // Cliquer '[data-test="btn-deconnexion"]'
    // await flushPromises()
    // Vérifier tokenStorage.effacerToken appelé
    // Vérifier wrapper.findAllComponents(LoginForm) a une longueur de 1
  });

  it("revient à l'écran de connexion si un appel API échoue avec 401 (token expiré)", async () => {
    // TODO : exerciseService.listerExercices.mockResolvedValue([{ _id: '1', name: 'Paradiddle', current_tempo: 100 }])
    // mount(App), await flushPromises() — session déjà active
    // const erreur401 = new Error('Non autorisé') ; erreur401.status = 401
    // exerciseService.supprimerExercice.mockRejectedValue(erreur401)
    // wrapper.findComponent(ExerciseList).vm.$emit('supprimer', '1')
    // await flushPromises()
    // Vérifier tokenStorage.effacerToken appelé
    // Vérifier wrapper.findAllComponents(LoginForm) a une longueur de 1
  });
});
