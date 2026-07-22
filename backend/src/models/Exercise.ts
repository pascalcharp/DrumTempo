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
  updated_at: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: ExerciseConfig.NAME_MAX_LENGTH,
    },
    current_tempo: {
      type: Number,
      default: null,
      validate: {
        validator: (v: number | null) =>
          v === null || (v >= ExerciseConfig.TEMPO_MIN && v <= ExerciseConfig.TEMPO_MAX),
        message: `Le tempo doit être entre ${ExerciseConfig.TEMPO_MIN} et ${ExerciseConfig.TEMPO_MAX} BPM`,
      },
    },
  },
  { timestamps: { updatedAt: 'updated_at', createdAt: false } }
);

export const Exercise = mongoose.model<IExercise>('Exercise', ExerciseSchema);
