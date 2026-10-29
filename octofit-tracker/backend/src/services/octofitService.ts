import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type ActivityInput = {
  userId: string;
  teamId: string;
  type: string;
  minutes: number;
};

type TeamInput = {
  name: string;
  mascot: string;
  members?: string[];
};

function requestError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

function parseActivityInput(input: unknown): ActivityInput {
  if (!isRecord(input)) throw requestError('Activity must be an object');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !isObjectId(userId)
    || typeof teamId !== 'string' || !isObjectId(teamId)) {
    throw requestError('Valid userId and teamId are required');
  }
  if (typeof type !== 'string' || !type.trim()) throw requestError('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw requestError('Minutes must be a positive number');
  }
  return { userId, teamId, type: type.trim(), minutes };
}

function parseTeamInput(input: unknown): TeamInput {
  if (!isRecord(input)) throw requestError('Team must be an object');
  const { name, mascot, members } = input;
  if (typeof name !== 'string' || !name.trim()) throw requestError('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw requestError('Team mascot is required');
  if (members !== undefined && (!Array.isArray(members)
    || !members.every((member): member is string => typeof member === 'string' && isObjectId(member)))) {
    throw requestError('Members must be valid user IDs');
  }
  return { name: name.trim(), mascot: mascot.trim(), members };
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const activityInput = parseActivityInput(input);
  const [user, team] = await Promise.all([
    User.findById(activityInput.userId),
    Team.findById(activityInput.teamId),
  ]);
  if (!user || !team) throw requestError('Activity user and team must exist', 404);
  return Activity.create({
    user: user._id,
    team: team._id,
    type: activityInput.type,
    minutes: activityInput.minutes,
    points: activityInput.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const teamInput = parseTeamInput(input);
  if (teamInput.members?.length) {
    const membersFound = await User.countDocuments({ _id: { $in: teamInput.members } });
    if (membersFound !== new Set(teamInput.members).size) throw requestError('Every team member must exist');
  }
  return Team.create({
    name: teamInput.name,
    mascot: teamInput.mascot,
    members: teamInput.members,
  });
}

export async function getLeaderboard() {
  const [teams, pointTotals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(pointTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw requestError('User not found', 404);

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    strength: 'strength',
    walk: 'mobility',
    yoga: 'mobility',
  };
  const goal = user.fitnessGoal.toLowerCase();
  const recentFocus = recentActivity
    ? activityFocus[recentActivity.type.toLowerCase()] ?? recentActivity.type.toLowerCase()
    : undefined;
  const workouts = await Workout.find().lean();
  const preferredFocus = workouts.some((workout) => workout.focus.toLowerCase() === goal)
    ? goal
    : recentFocus;

  return workouts
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === preferredFocus
        ? `Matches your ${preferredFocus} ${preferredFocus === goal ? 'goal' : 'activity'}.`
        : `A ${workout.focus} option to complement your training.`,
    }))
    .sort((left, right) => Number(right.focus.toLowerCase() === preferredFocus) - Number(left.focus.toLowerCase() === preferredFocus));
}

export { User };
