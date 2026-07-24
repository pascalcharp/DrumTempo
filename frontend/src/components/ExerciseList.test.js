import {mount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';
import ExerciseList from './ExerciseList.vue';
import {TempoConfig} from '../config/TempoConfig';

// Ordre des boutons dans le template pour chaque <li> : [0] "-5", [1] "+5", [2] "Supprimer"
const exercicesExemple = [
    {_id: '1', name: 'Paradiddle', current_tempo: 120},
    {_id: '2', name: 'Flam', current_tempo: null},
];

describe('ExerciseList', () => {
    it('affiche un <li> par exercice avec son nom et son tempo (ou "-" si null)', () => {

        const wrapper = mount(ExerciseList, {
            props: {exercises: exercicesExemple}
        });

        const items = wrapper.findAll('li.exercice');
        expect(items).toHaveLength(3); // TEMPORAIRE : casse volontairement le test pour valider la CI (Étape 6.5)

        expect(items[0].find('.nom').text()).toBe('Paradiddle');
        expect(items[0].find('.tempo').text()).toBe('120');
        expect(items[1].find('.nom').text()).toBe('Flam');
        expect(items[1].find('.tempo').text()).toBe('-');

    });


    it("émet 'ajuster-tempo' avec (id, tempo actuel, +TEMPO_STEP) au clic sur le bouton +", async () => {

        const wrapper = mount(ExerciseList, {
            props: {exercises: [{_id: '1', name: 'Paradiddle', current_tempo: 120}]}
        });

        const boutonPlus = wrapper.find('[data-test="btn-incr"]');
        expect(boutonPlus.exists()).toBe(true);
        await boutonPlus.trigger('click');

        expect(wrapper.emitted('ajuster-tempo')).toEqual([
            ['1', 120, TempoConfig.TEMPO_STEP]
        ]);


    });

    it("émet 'ajuster-tempo' avec un delta négatif au clic sur le bouton -", async () => {

        const wrapper = mount(ExerciseList, {
            props: {exercises: [{_id: '1', name: 'Paradiddle', current_tempo: 120}]}
        });

        const boutonMoins = wrapper.find('[data-test="btn-decr"]');
        expect(boutonMoins.exists()).toBe(true);
        await boutonMoins.trigger('click');

        expect(wrapper.emitted('ajuster-tempo')).toEqual([
            ['1', 120, -TempoConfig.TEMPO_STEP]
        ]);

    });

    it("émet 'supprimer' avec l'id au clic sur le bouton Supprimer", async () => {

        const wrapper = mount(ExerciseList, {
            props: {exercises: [{_id: '1', name: 'Paradiddle', current_tempo: 120}]}
        });

        const boutonSupprimer = wrapper.find('[data-test="btn-suppr"]');
        expect(boutonSupprimer.exists()).toBe(true);
        await boutonSupprimer.trigger('click');

        expect(wrapper.emitted('supprimer')).toEqual([
            ['1']
        ]);

    });

    it('désactive le bouton "-" quand le tempo est à TEMPO_MIN', async () => {

        const wrapper = mount(ExerciseList, {
            props: {exercises: [{_id: '1', name: 'Paradiddle', current_tempo: TempoConfig.TEMPO_MIN}]}
        });

        const boutonMoins = wrapper.find('[data-test="btn-decr"]');
        expect(boutonMoins.exists()).toBe(true);
        expect(boutonMoins.attributes('disabled')).toBeDefined();

    });

    it('désactive le bouton "-" quand le tempo est null', async () => {

        const wrapper = mount(ExerciseList, {
            props: {exercises: [{_id: '1', name: 'Paradiddle', current_tempo: null}]}
        });

        const boutonMoins = wrapper.find('[data-test="btn-decr"]');
        expect(boutonMoins.exists()).toBe(true);
        expect(boutonMoins.attributes('disabled')).toBeDefined();

    });


    it('désactive le bouton "+" quand le tempo est à TEMPO_MAX', async () => {

        const wrapper = mount(ExerciseList, {
            props: {exercises: [{_id: '1', name: 'Paradiddle', current_tempo: TempoConfig.TEMPO_MAX}]}
        });

        const boutonPlus = wrapper.find('[data-test="btn-incr"]');
        expect(boutonPlus.exists()).toBe(true) ;
        expect(boutonPlus.attributes('disabled')).toBeDefined() ;

    }) ;

    it('tempo null --> le bouton "+" demeure actif', async () => {

        const wrapper = mount(ExerciseList, {
            props: {exercises: [{_id: '1', name: 'Paradiddle', current_tempo: null}]}
        });

        const boutonPlus = wrapper.find('[data-test="btn-incr"]');
        expect(boutonPlus.exists()).toBe(true);
        expect(boutonPlus.attributes('disabled')).toBeUndefined();

    }) ;

    it('Le passage de TEMPO_MAX à TEMPO_MAX-1 réactive dynamiquement le bouton +', async () => {

        const wrapper = mount(ExerciseList, {
            props: {exercises: [{_id: '1', name: 'Paradiddle', current_tempo: TempoConfig.TEMPO_MAX}]}
        });

        const boutonPlus = wrapper.find('[data-test="btn-incr"]');
        expect(boutonPlus.exists()).toBe(true);
        expect(boutonPlus.attributes('disabled')).toBeDefined();

        await wrapper.setProps({
            exercises: [{_id: '1', name: 'Paradiddle', current_tempo: TempoConfig.TEMPO_MAX - 1}]
        })

        expect(boutonPlus.attributes('disabled')).toBeUndefined();

    }) ;

    it('Le passage de TEMPO_MIN à TEMPO_MIN + 1 réactive dynamiquement le bouton -', async () => {

        const wrapper = mount(ExerciseList, {
            props: {exercises: [{_id: '1', name: 'Paradiddle', current_tempo: TempoConfig.TEMPO_MIN}]}
        });

        const boutonMoins = wrapper.find('[data-test="btn-decr"]');
        expect(boutonMoins.exists()).toBe(true);
        expect(boutonMoins.attributes('disabled')).toBeDefined();

        await wrapper.setProps({
            exercises: [{_id: '1', name: 'Paradiddle', current_tempo: TempoConfig.TEMPO_MIN + 1}]
        })

        expect(boutonMoins.attributes('disabled')).toBeUndefined();

    }) ;


});
