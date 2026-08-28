import type { Cycle, Org, Status } from "@/data/schema";
import { daysUntil } from "@/lib/date";

/** Latest cycle by term string order as authored (last entry = most current). */
export function getLatestCycle(org: Org) {
  return org.cycles[org.cycles.length - 1];
}

/**
 * The status a cycle actually has *today*, derived from its dates.
 *
 * Once `opensAt` / `closesAt` are filled in, a cycle moves
 * Upcoming → Open → Closed on its own as those dates pass, so nobody has to
 * hand-edit the `status` field. When the dates can't settle it (e.g. only a
 * close date is known, or none at all), the stored `status` is used as-is.
 * `Rolling` always stays `Rolling`.
 */
export function effectiveStatus(cycle: Cycle): Status {
  if (cycle.status === "Rolling") return "Rolling";

  const daysToClose = cycle.closesAt ? daysUntil(cycle.closesAt) : null;
  const daysToOpen = cycle.opensAt ? daysUntil(cycle.opensAt) : null;

  if (daysToClose !== null && daysToClose < 0) return "Closed";
  if (daysToOpen !== null && daysToOpen <= 0) return "Open";
  if (daysToOpen !== null && daysToOpen > 0) return "Upcoming";

  return cycle.status;
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
    const sa = effectiveStatus(ca);
    const sb = effectiveStatus(cb);

    const rankDiff = STATUS_URGENCY[sa] - STATUS_URGENCY[sb];
    if (rankDiff !== 0) return rankDiff;

    if (sa === "Open" || sa === "Upcoming") {
      const dateA = sa === "Open" ? ca.closesAt : ca.opensAt;
      const dateB = sb === "Open" ? cb.closesAt : cb.opensAt;
      if (dateA && dateB) return dateA.localeCompare(dateB);
      if (dateA) return -1;
      if (dateB) return 1;
    }

    return a.name.localeCompare(b.name);
  });
}
