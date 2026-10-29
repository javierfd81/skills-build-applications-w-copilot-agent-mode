import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const load = () => getJson<Record<string, unknown>>('/api/activities');

export default function Activities() {
  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    load={load}
    responseKey="activities"
    emptyMessage="No activities yet."
    renderItem={(activity) => `${activity.type ?? 'Activity'} · ${activity.minutes ?? 0} minutes · ${activity.points ?? 0} points`}
  />;
}
