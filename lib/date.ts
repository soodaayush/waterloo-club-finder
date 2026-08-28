export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Whole days from today until the given ISO date. Negative if in the past. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

/** Whole days elapsed since the given ISO date. Negative if in the future. */
export function daysSince(iso: string | null): number | null {
  const d = daysUntil(iso);
  return d === null ? null : -d;
}

/** A cycle is "stale" if nobody has re-checked its details in this long. */
export const STALE_AFTER_DAYS = 60;

export function isStale(lastVerified: string | null): boolean {
  const d = daysSince(lastVerified);
  return d !== null && d > STALE_AFTER_DAYS;
}
