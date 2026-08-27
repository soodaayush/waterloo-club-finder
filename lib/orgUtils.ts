import type { Org } from "@/data/schema";

/** Latest cycle by term string order as authored (last entry = most current). */
export function getLatestCycle(org: Org) {
  return org.cycles[org.cycles.length - 1];
}

const STATUS_URGENCY: Record<string, number> = {
  Open: 0,
  Rolling: 1,
  Upcoming: 2,
  Closed: 3,
};

/** Sort orgs by how urgently a student should act: open deadlines soonest first. */
export function sortByUrgency(orgs: Org[]): Org[] {
  return [...orgs].sort((a, b) => {
    const ca = getLatestCycle(a);
    const cb = getLatestCycle(b);

    const rankDiff = STATUS_URGENCY[ca.status] - STATUS_URGENCY[cb.status];
    if (rankDiff !== 0) return rankDiff;

    if (ca.status === "Open" || ca.status === "Upcoming") {
      const dateA = ca.status === "Open" ? ca.closesAt : ca.opensAt;
      const dateB = cb.status === "Open" ? cb.closesAt : cb.opensAt;
      if (dateA && dateB) return dateA.localeCompare(dateB);
      if (dateA) return -1;
      if (dateB) return 1;
    }

    return a.name.localeCompare(b.name);
  });
}
