import mongoose from 'mongoose';
import { Config } from '../config/Config';
import { Exercise } from '../models/Exercise';
import { ExerciseConfig } from '../config/ExerciseConfig';

async function runTests(): Promise<void> {
  await mongoose.connect(Config.MONGO_URI);
  console.log('Connecté à MongoDB\n');

  await Exercise.deleteMany({});

  const ex1 = await Exercise.create({ name: 'Paradiddle' });
  console.log(`✓ Exercice sans tempo créé : "${ex1.name}" / tempo = ${ex1.current_tempo}`);

  const ex2 = await Exercise.create({ name: 'Single Stroke Roll', current_tempo: 120 });
  console.log(`✓ Exercice avec tempo créé : "${ex2.name}" / tempo = ${ex2.current_tempo}`);

  try {
    await Exercise.create({ name: 'Test Tempo Bas', current_tempo: ExerciseConfig.TEMPO_MIN - 1 });
    console.error('✗ Aurait dû être bloqué : tempo trop bas');
  } catch {
    console.log(`✓ Tempo < ${ExerciseConfig.TEMPO_MIN} correctement rejeté`);
  }

  try {
    await Exercise.create({ name: 'Test Tempo Haut', current_tempo: ExerciseConfig.TEMPO_MAX + 1 });
    console.error('✗ Aurait dû être bloqué : tempo trop haut');
  } catch {
    console.log(`✓ Tempo > ${ExerciseConfig.TEMPO_MAX} correctement rejeté`);
  }

  try {
    await Exercise.create({ name: 'Paradiddle' });
    console.error('✗ Aurait dû être bloqué : nom dupliqué');
  } catch {
    console.log('✓ Nom dupliqué correctement rejeté');
  }

  await mongoose.disconnect();
  console.log('\nTests terminés.');
}

runTests().catch(console.error);
