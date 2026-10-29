import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const userEmail = 'mona@example.com';
const load = () => getJson<Record<string, unknown>>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);

export default function Workouts() {
  return <CapabilityCard
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    load={load}
    responseKey="suggestions"
    emptyMessage="No workout suggestions available."
    renderItem={(workout) => <><strong>{typeof workout.title === 'string' ? workout.title : 'Workout'}</strong>{typeof workout.reason === 'string' ? ` · ${workout.reason}` : ''}</>}
  />;
}
