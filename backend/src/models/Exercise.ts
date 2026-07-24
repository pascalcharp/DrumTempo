import mongoose, { Schema, Document } from 'mongoose';
import { ExerciseConfig } from '../config/ExerciseConfig';

/**
 * @openapi
 * components:
 *   schemas:
 *     Exercise:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "Paradiddle"
 *         current_tempo:
 *           type: integer
 *           nullable: true
 *           minimum: 40
 *           maximum: 300
 *           example: 120
 *         updated_at:
 *           type: string
 *           format: date-time
 */
export interface IExercise extends Document {
  name: string;
  current_tempo: number | null;
  owner: mongoose.Types.ObjectId;
  updated_at: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: ExerciseConfig.NAME_MAX_LENGTH,
    },
    current_tempo: {
      type: Number,
      default: null,
      validate: {
        validator: (v: number | null) =>
          v === null || (v >= ExerciseConfig.TEMPO_MIN && v <= ExerciseConfig.TEMPO_MAX),
        message: ExerciseConfig.MSG_TEMPO_OUT_OF_RANGE,
      },
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      select: false, // usage interne (filtrage/scoping) uniquement — jamais renvoyé au frontend
    },
  },
  { timestamps: { updatedAt: 'updated_at', createdAt: false }, versionKey: false }
);

// Le nom est unique par utilisateur, pas globalement : deux utilisateurs peuvent
// chacun avoir un exercice "Paradiddle".
ExerciseSchema.index({ name: 1, owner: 1 }, { unique: true });

export const Exercise = mongoose.model<IExercise>('Exercise', ExerciseSchema);
