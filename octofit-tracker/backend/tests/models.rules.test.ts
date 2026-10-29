import { describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../src/models/index.js';

describe('OctoFit model rules', () => {
  it('rejects malformed emails, unknown difficulties, and unrealistic durations', () => {
    expect(new User({ name: 'A', email: 'not-an-email', fitnessGoal: 'x' }).validateSync()?.errors.email).toBeDefined();
    expect(new Workout({ title: 'T', focus: 'f', minutes: 30, difficulty: 'brutal' }).validateSync()?.errors.difficulty).toBeDefined();
    expect(new Workout({ title: 'T', focus: 'f', minutes: 900, difficulty: 'easy' }).validateSync()?.errors.minutes).toBeDefined();
    const normalized = new Workout({ title: 'T', focus: 'f', minutes: 30, difficulty: ' HARD ' });
    expect(normalized.validateSync()).toBeUndefined();
    expect(normalized.difficulty).toBe('hard');
    expect(new Activity({ type: ' Run ' }).type).toBe('run');
  });

  it('enforces unique emails, team names, and workout titles', async () => {
    const server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
    try {
      await Promise.all([User.init(), Team.init(), Workout.init()]);
      await User.create({ name: 'A', email: 'Dup@Example.com', fitnessGoal: 'x' });
      await expect(User.create({ name: 'B', email: 'dup@example.com', fitnessGoal: 'y' })).rejects.toThrow(/duplicate/i);
      await Team.create({ name: 'T', mascot: 'm' });
      await expect(Team.create({ name: 'T', mascot: 'n' })).rejects.toThrow(/duplicate/i);
      await Workout.create({ title: 'W', focus: 'f', minutes: 10, difficulty: 'easy' });
      await expect(Workout.create({ title: 'W', focus: 'g', minutes: 10, difficulty: 'easy' })).rejects.toThrow(/duplicate/i);
    } finally {
      await mongoose.disconnect();
      await server.stop();
    }
  });
});
