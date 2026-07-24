import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ExerciseForm from './ExerciseForm.vue';

describe('ExerciseForm', () => {
  it("émet 'ajouter' avec le nom et le tempo saisis à la soumission", async () => {
    // TODO : mount(ExerciseForm)
    // Remplir les champs : wrapper.find('input[type="text"]').setValue('Paradiddle')
    //                      wrapper.find('input[type="number"]').setValue(120)
    // Soumettre : wrapper.find('form').trigger('submit')
    // Vérifier wrapper.emitted('ajouter')[0] === [{ name: 'Paradiddle', current_tempo: 120 }]
  });

  it('émet current_tempo: null quand le champ tempo est laissé vide', async () => {
    // TODO : remplir seulement le nom, soumettre, vérifier current_tempo === null dans l'événement émis
  });

  it('réinitialise les deux champs après soumission', async () => {
    // TODO : remplir puis soumettre, puis vérifier que les inputs sont revenus à vide
    // Indice : wrapper.find('input[type="text"]').element.value
  });
});
