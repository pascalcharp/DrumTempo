import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { Exercise } from './Exercise';
import { ExerciseConfig } from '../config/ExerciseConfig';

const fauxOwnerId = new mongoose.Types.ObjectId();

describe('Modèle Exercise', () => {
  it('accepte current_tempo null (aucun tempo déterminé encore)', async () => {

    const exercice = new Exercise({ name: "Flam", current_tempo: null, owner: fauxOwnerId}) ;
    const exerciceSauvegarde = await exercice.save() ;

    expect(exerciceSauvegarde.current_tempo).toBeNull() ;

  });

  it('rejette un tempo sous TEMPO_MIN', async () => {
    const exercice = new Exercise({ name: "Flam", current_tempo: ExerciseConfig.TEMPO_MIN - 1, owner: fauxOwnerId }) ;

    await expect(exercice.validate()).rejects.toThrow() ;
  });

  it('rejette un tempo au-dessus de TEMPO_MAX', async () => {
    const exercice = new Exercise({ name: "Flam", current_tempo: ExerciseConfig.TEMPO_MAX + 1, owner: fauxOwnerId }) ;

    await expect(exercice.validate()).rejects.toThrow() ;
  });

  it('accepte la borne exacte TEMPO_MIN', async () => {
    const exercice = new Exercise({ name: "Flam", current_tempo: ExerciseConfig.TEMPO_MIN, owner: fauxOwnerId }) ;
    await expect(exercice.validate()).resolves.toBeUndefined() ;
  });

  it('accepte la borne exacte TEMPO_MAX', async () => {
    const exercice = new Exercise({ name: "Flam", current_tempo: ExerciseConfig.TEMPO_MAX, owner: fauxOwnerId }) ;
    await expect(exercice.validate()).resolves.toBeUndefined() ;
  });

  it('exige un name', async () => {

    const exercice = new Exercise({ current_tempo: ExerciseConfig.TEMPO_MAX, owner: fauxOwnerId }) ;
    await expect(exercice.validate()).rejects.toThrow() ;
  });

  it("impose l'unicité du name par owner, mais permet le même name pour deux owners différents", async () => {

    const original = new Exercise({ name: 'Ratamacue', current_tempo: null, owner: fauxOwnerId }) ;
    const originalSauvegarde = await original.save() ;
    expect(originalSauvegarde).toEqual(
        expect.objectContaining({
          name: "Ratamacue",
          current_tempo: null,
          owner: fauxOwnerId
        })
    );

    // Doit échouer: duplicata de name et owner
    const totalDuplicate = new Exercise({name: "Ratamacue", current_tempo: null, owner: fauxOwnerId }) ;
    await expect(totalDuplicate.save()).rejects.toMatchObject({ code: 11000 });

    // Doit réussir: duplicata de name mais NON de owner
    const otherOwnerId = new mongoose.Types.ObjectId() ;
    const partialDuplicate = new Exercise({name: "Ratamacue", current_tempo: null, owner: otherOwnerId }) ;
    const partialDuplicateSauvegarde = await partialDuplicate.save() ;
    expect(partialDuplicateSauvegarde).toEqual(
        expect.objectContaining({
          name: "Ratamacue",
          current_tempo: null,
          owner: otherOwnerId
        })
    )
  });
});
