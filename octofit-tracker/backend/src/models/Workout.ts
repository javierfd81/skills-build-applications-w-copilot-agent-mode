import { Schema, model } from 'mongoose';

const workoutSchema = new Schema({
  title: { type: String, required: true, trim: true, unique: true },
  focus: { type: String, required: true, trim: true },
  minutes: { type: Number, required: true, min: 1, max: 300 },
  difficulty: { type: String, required: true, trim: true, lowercase: true, enum: ['easy', 'moderate', 'hard'] },
});

export const Workout = model('Workout', workoutSchema);
