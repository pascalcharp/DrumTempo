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
import {AuthConfig} from "@/config/AuthConfig.js";


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
    tokenStorage.obtenirToken.mockReturnValue(null)
    const appWrapper = mount(App) ;
    await flushPromises() ;

    expect(appWrapper.findAllComponents(LoginForm) ).toHaveLength(1);
    expect(appWrapper.findAllComponents(ExerciseList) ).toHaveLength(0) ;
    expect(exerciseService.listerExercices).not.toHaveBeenCalled() ;
  });

  it('se connecte avec succès : stocke le token et charge les exercices', async () => {

    tokenStorage.obtenirToken.mockReturnValue(null) ;
    authService.login.mockResolvedValue({ token: 'nouveau-token' }) ;
    exerciseService.listerExercices.mockResolvedValue([]) ;

    const appWrapper = mount(App) ;
    await flushPromises() ;

    appWrapper.findComponent(LoginForm).vm.$emit('connexion', { email: 'user@good.login', password: 'validpassword' }) ;
    await flushPromises() ;
    expect(authService.login).toHaveBeenCalledWith({email: 'user@good.login', password: 'validpassword' }) ;
    expect(tokenStorage.stockerToken).toHaveBeenCalledWith('nouveau-token') ;
    expect(appWrapper.findAllComponents(LoginForm) ).toHaveLength(0) ;
    expect(appWrapper.findAllComponents(ExerciseList) ).toHaveLength(1) ;

  });

  it("affiche l'erreur de connexion sur échec (identifiants invalides)", async () => {
    tokenStorage.obtenirToken.mockReturnValue(null) ;
    authService.login.mockRejectedValue(new Error('Identifiants invalides')) ;
    const appWrapper = mount(App) ;
    await flushPromises() ;

    appWrapper.findComponent(LoginForm).vm.$emit('connexion', { email: 'bad@user.com', password: 'invalidpassword' }) ;
    await flushPromises()

    expect(appWrapper.findAllComponents(LoginForm) ).toHaveLength(1) ;
    expect(appWrapper.findAllComponents(ExerciseList) ).toHaveLength(0) ;
    expect(exerciseService.listerExercices).not.toHaveBeenCalled() ;
    expect(appWrapper.findComponent(LoginForm).props('erreur')).toBe('Identifiants invalides') ;

  });

  it('se déconnecte et revient à l\'écran de connexion', async () => {
    exerciseService.listerExercices.mockResolvedValue([])

    const appWrapper = mount(App) ;
    await flushPromises() ;

    const disconnectButtonWrapper = appWrapper.find('[data-test="btn-deconnexion"]') ;
    await disconnectButtonWrapper.trigger('click') ;
    await flushPromises() ;

    expect(tokenStorage.effacerToken).toHaveBeenCalled() ;
    expect(appWrapper.findAllComponents(LoginForm)).toHaveLength(1) ;
    expect(appWrapper.findAllComponents(ExerciseList) ).toHaveLength(0) ;
  });

  it("revient à l'écran de connexion si un appel API échoue avec 401 (token expiré)", async () => {
    exerciseService.listerExercices.mockResolvedValue([{ _id: '1', name: 'Paradiddle', current_tempo: 100 }]) ;
    const appWrapper = mount(App);
    await flushPromises() ;
    const erreur401 = new Error('Non autorisé') ;
    erreur401.status = 401
    exerciseService.supprimerExercice.mockRejectedValue(erreur401) ;
    appWrapper.findComponent(ExerciseList).vm.$emit('supprimer', '1')
    await flushPromises()

    expect(tokenStorage.effacerToken).toHaveBeenCalled() ;
    expect(appWrapper.findAllComponents(LoginForm) ).toHaveLength(1) ;
    expect(appWrapper.findAllComponents(ExerciseList) ).toHaveLength(0) ;
    expect(appWrapper.findComponent(LoginForm).props('erreur')).toBe(AuthConfig.SESSION_EXPIREE_MESSAGE) ;

  });
});
