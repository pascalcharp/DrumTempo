import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';

const sanitySchema = new mongoose.Schema({ label: { type: String, required: true } });
const SanityModel = mongoose.model('Sanity', sanitySchema);

describe('Infrastructure de test (Vitest + MongoDB en mémoire)', () => {
  it('écrit et relit un document via Mongoose', async () => {
    const created = await SanityModel.create({ label: 'ok' });

    const found = await SanityModel.findById(created._id);

    expect(found?.label).toBe('ok');
  });
});
