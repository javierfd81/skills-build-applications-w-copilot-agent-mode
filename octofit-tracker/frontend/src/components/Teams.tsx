import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  return <CapabilityCard
    title="Teams"
    description="Manage teams and members."
    endpoint="/api/teams"
    responseKey="teams"
    emptyMessage="No teams yet."
    renderItem={(team) => `${team.name ?? 'Team'}${team.mascot ? ` · ${team.mascot}` : ''}`}
  />;
}
