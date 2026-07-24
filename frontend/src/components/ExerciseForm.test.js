import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ExerciseForm from './ExerciseForm.vue';
import {TempoConfig} from "@/config/TempoConfig.js";

describe('ExerciseForm', () => {
  it("émet 'ajouter' avec le nom et le tempo saisis à la soumission", async () => {

    const wrapper = mount(ExerciseForm) ;

    const inputNom = wrapper.find('[data-test="input-nom"]') ;
    expect(inputNom.exists()).toBe(true) ;
    await inputNom.setValue("Paradiddle") ;

    const inputTempo = wrapper.find('[data-test="input-tempo"]') ;
    expect(inputTempo.exists()).toBe(true) ;
    await inputTempo.setValue(TempoConfig.TEMPO_MIN) ;

    const formulaire = wrapper.find('[data-test="form-nouvelExercice"]') ;
    expect(formulaire.exists()).toBe(true) ;
    await formulaire.trigger('submit') ;

    const signalEmis = wrapper.emitted("ajouter") ;
    expect(signalEmis).toHaveLength(1) ;
    expect(signalEmis.at(0)).toEqual( [{name: 'Paradiddle', current_tempo: TempoConfig.TEMPO_MIN}] );


  });

  it('émet current_tempo: null quand le champ tempo est laissé vide (donc = null)', async () => {

    const wrapper = mount(ExerciseForm) ;

    const inputNom = wrapper.find('[data-test="input-nom"]') ;
    expect(inputNom.exists()).toBe(true) ;
    await inputNom.setValue("Paradiddle") ;

    const formulaire = wrapper.find('[data-test="form-nouvelExercice"]') ;
    expect(formulaire.exists()).toBe(true) ;
    await formulaire.trigger('submit') ;

    const signalEmis = wrapper.emitted("ajouter") ;
    expect(signalEmis).toHaveLength(1) ;
    expect(signalEmis.at(0)).toEqual( [{name: 'Paradiddle', current_tempo: null}] );

  });

  it('émet current_tempo: null si le champ tempo est effacé (donc = "")', async () => {

    const wrapper = mount(ExerciseForm) ;

    const inputNom = wrapper.find('[data-test="input-nom"]') ;
    expect(inputNom.exists()).toBe(true) ;
    await inputNom.setValue("Paradiddle") ;

    const inputTempo = wrapper.find('[data-test="input-tempo"]') ;
    expect(inputTempo.exists()).toBe(true) ;
    await inputTempo.setValue("") ;


    const formulaire = wrapper.find('[data-test="form-nouvelExercice"]') ;
    expect(formulaire.exists()).toBe(true) ;
    await formulaire.trigger('submit') ;

    const signalEmis = wrapper.emitted("ajouter") ;
    expect(signalEmis).toHaveLength(1) ;
    expect(signalEmis.at(0)).toEqual( [{name: 'Paradiddle', current_tempo: null}] );

  });

  it('réinitialise les deux champs après soumission', async () => {

    const wrapper = mount(ExerciseForm) ;

    const inputNom = wrapper.find('[data-test="input-nom"]') ;
    expect(inputNom.exists()).toBe(true) ;
    await inputNom.setValue("Paradiddle") ;

    const inputTempo = wrapper.find('[data-test="input-tempo"]') ;
    expect(inputTempo.exists()).toBe(true) ;
    await inputTempo.setValue(TempoConfig.TEMPO_MIN) ;

    const formulaire = wrapper.find('[data-test="form-nouvelExercice"]') ;
    expect(formulaire.exists()).toBe(true) ;
    await formulaire.trigger('submit') ;

    const signalEmis = wrapper.emitted("ajouter") ;
    expect(signalEmis).toHaveLength(1) ;

    expect(inputNom.element.value).toBe("") ;
    expect(inputTempo.element.value).toBe("") ;
  });
});
