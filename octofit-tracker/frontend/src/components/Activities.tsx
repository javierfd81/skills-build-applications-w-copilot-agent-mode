import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    endpoint="/api/activities"
    responseKey="activities"
    emptyMessage="No activities yet."
    renderItem={(activity) => `${activity.type ?? 'Activity'} · ${activity.minutes ?? 0} minutes · ${activity.points ?? 0} points`}
  />;
}
