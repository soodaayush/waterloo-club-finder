import type { Cycle, Discipline, Org, Status } from "@/data/schema";
import { daysUntil } from "@/lib/date";
import semanticNeighbors from "@/data/related.json";

/** Disciplines in display order (hardware → software → the rest). */
export const DISCIPLINES: Discipline[] = [
  "Mechanical",
  "Electrical",
  "Firmware",
  "Software",
  "Civil",
  "Science",
  "Business",
];

/** Latest cycle by term string order as authored (last entry = most current). */
export function getLatestCycle(org: Org) {
  return org.cycles[org.cycles.length - 1];
}

/**
 * Tags too broad to signal "a student into X would also like Y". They either
 * mirror a discipline or apply to a third of the list. Ignored when matching
 * related orgs (still shown/searchable everywhere else).
 */
const BROAD_TAGS = new Set([
  "software",
  "mechanical",
  "electrical",
  "embedded",
  "civil",
  "hardware",
  "research",
  "competition",
  "sustainability",
  "community",
  "events",
  "professional-society",
]);

/**
 * Other orgs a student looking at `org` would plausibly also consider.
 * Requires at least one *specific* shared tag ("robotics", "computer-vision");
 * shared disciplines only break ties among those.
 *
 * When that rule doesn't fill `limit`, remaining slots come from
 * data/related.json - a description/tag embedding similarity computed once
 * at build time by scripts/compute-related.ts, never at request time. This
 * only fills gaps the explicit tag rule above misses; it never outranks or
 * replaces an actual shared-tag match, since that rule is the one a
 * maintainer can actually read and reason about.
 */
export function relatedOrgs(org: Org, all: Org[], limit = 4): Org[] {
  const specific = new Set(org.tags.filter((t) => !BROAD_TAGS.has(t)));

  const tagMatches = all
    .filter((o) => o.slug !== org.slug)
    .map((o) => ({
      org: o,
      tagScore: o.tags.filter((t) => specific.has(t)).length,
      discScore: o.disciplines.filter((d) => org.disciplines.includes(d)).length,
    }))
    .filter((x) => x.tagScore > 0)
    .sort(
      (a, b) =>
        b.tagScore - a.tagScore ||
        b.discScore - a.discScore ||
        a.org.name.localeCompare(b.org.name)
    )
    .map((x) => x.org);

  if (tagMatches.length >= limit) return tagMatches.slice(0, limit);

  const bySlug = new Map(all.map((o) => [o.slug, o]));
  const seen = new Set([org.slug, ...tagMatches.map((o) => o.slug)]);
  const neighbors: string[] =
    (semanticNeighbors as Record<string, string[]>)[org.slug] ?? [];

  const fillers: Org[] = [];
  for (const slug of neighbors) {
    if (tagMatches.length + fillers.length >= limit) break;
    if (seen.has(slug)) continue;
    const candidate = bySlug.get(slug);
    if (candidate) fillers.push(candidate);
  }

  return [...tagMatches, ...fillers];
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

/** Orgs whose current cycle has a real, time-boxed application window open right now. */
export function openWithDeadlineCount(orgs: Org[]): number {
  return orgs.filter((org) => effectiveStatus(getLatestCycle(org)) === "Open")
    .length;
}

/**
 * Orgs with an application window that's open right now and closes within
 * `withinDays`, soonest-closing first. Powers the homepage "Closing soon" rail.
 */
export function closingSoon(orgs: Org[], withinDays = 14, limit = 6): Org[] {
  return orgs
    .filter((org) => {
      const cycle = getLatestCycle(org);
      if (effectiveStatus(cycle) !== "Open" || !cycle.closesAt) return false;
      const days = daysUntil(cycle.closesAt);
      return days !== null && days >= 0 && days <= withinDays;
    })
    .sort((a, b) =>
      getLatestCycle(a).closesAt!.localeCompare(getLatestCycle(b).closesAt!)
    )
    .slice(0, limit);
}

/** Human phrasing for a status, used in page titles and share cards. */
export const STATUS_PHRASE: Record<Status, string> = {
  Open: "Applications open",
  Closed: "Applications closed",
  Upcoming: "Applications open soon",
  Rolling: "Open to join anytime",
};

/** Short label for a status, used on filter chips. */
export const STATUS_LABEL: Record<Status, string> = {
  Open: "Open",
  Upcoming: "Upcoming",
  Rolling: "No deadline",
  Closed: "Closed",
};

/** Display label for a category (the raw values are PascalCase). */
export const CATEGORY_LABEL: Record<string, string> = {
  DesignTeam: "Design Team",
  Club: "Club",
  CaseComp: "Case Comp",
  Other: "Other",
};

const STATUS_URGENCY: Record<string, number> = {
  Open: 0,
  Upcoming: 1,
  Rolling: 2,
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
