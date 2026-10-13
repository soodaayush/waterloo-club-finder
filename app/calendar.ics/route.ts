import { getAllOrgs } from "@/lib/getOrgs";
import { buildCalendar } from "@/lib/ics";

// Static-ish: deadlines only move as data.json changes, which requires a
// redeploy anyway, so this can revalidate on the same cadence as the pages.
export const revalidate = 3600;

export function GET() {
  const body = buildCalendar(getAllOrgs(), "Waterloo Club Finder deadlines");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="waterloo-club-finder.ics"',
    },
  });
}
