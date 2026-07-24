import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ExerciseList from './ExerciseList.vue';
import { TempoConfig } from '../config/TempoConfig';

// Ordre des boutons dans le template pour chaque <li> : [0] "-5", [1] "+5", [2] "Supprimer"
const exercicesExemple = [
  { _id: '1', name: 'Paradiddle', current_tempo: 120 },
  { _id: '2', name: 'Flam', current_tempo: null },
];

describe('ExerciseList', () => {
  it('affiche un <li> par exercice avec son nom et son tempo (ou "-" si null)', () => {

      const wrapper = mount(ExerciseList, {
        props: { exercises: exercicesExemple }
      }) ;

      const items = wrapper.findAll('li.exercice') ;
      expect(items).toHaveLength(2) ;

      expect(items[0].find('.nom').text()).toBe('Paradiddle') ;
      expect(items[0].find('.tempo').text()).toBe('120') ;
      expect(items[1].find('.nom').text()).toBe('Flam') ;
      expect(items[1].find('.tempo').text()).toBe('-') ;

  });


  it("émet 'ajuster-tempo' avec (id, tempo actuel, +TEMPO_STEP) au clic sur le bouton +", async () => {

      const wrapper = mount(ExerciseList, {
                  props: { exercises: [{ name: 'Paradiddle', current_tempo: 120 }] }
      }) ;

      const boutonPlus = wrapper.find('[data-test="btn-incr"]') ;
      expect(boutonPlus.exists()).toBe(true) ;
      await boutonPlus.trigger('click') ;

      expect(wrapper.emitted('ajuster-tempo')).toEqual([
          ['1', 120, TempoConfig.TEMPO_STEP]
      ]);



  });

  it("émet 'ajuster-tempo' avec un delta négatif au clic sur le bouton -", async () => {
    // TODO : même principe avec le bouton "-" (index 0) et -TempoConfig.TEMPO_STEP attendu
  });

  it("émet 'supprimer' avec l'id au clic sur le bouton Supprimer", async () => {
    // TODO : wrapper.find('.supprimer').trigger('click'), vérifier wrapper.emitted('supprimer')
  });

  it('désactive le bouton "-" quand le tempo est à TEMPO_MIN ou null', () => {
    // TODO : monter avec current_tempo: TempoConfig.TEMPO_MIN, vérifier wrapper.find(...).attributes('disabled')
    // Remonter avec current_tempo: null -> aussi désactivé
  });

  it('désactive le bouton "+" quand le tempo est à TEMPO_MAX, mais PAS quand il est null', () => {
    // TODO : monter avec current_tempo: TempoConfig.TEMPO_MAX -> bouton "+" désactivé
    // Remonter avec current_tempo: null -> bouton "+" actif
    // (décision UX de l'Étape 4 : premier réglage amène directement à TEMPO_MIN, voir DEVLOG)
  });
});
