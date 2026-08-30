// All the dates in this app are plain calendar dates ("2026-09-01") with no
// time or zone. "Has the deadline passed?" has to be answered from the
// perspective of Waterloo, not whatever timezone the server happens to run in
// (UTC, on Vercel), otherwise a deadline flips to Closed the previous
// evening for everyone actually in Ontario.
const TIMEZONE = "America/Toronto";

/** Today's calendar date in Waterloo's timezone, as "YYYY-MM-DD". */
export function todayISO(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Midnight UTC for a "YYYY-MM-DD" string, in ms. Both anchors below use the
 *  same convention so the subtraction is a clean day count, DST included. */
function epochOf(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getTime();
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Whole days from today (Waterloo time) until the given ISO date. Negative if in the past. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((epochOf(iso) - epochOf(todayISO())) / msPerDay);
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
