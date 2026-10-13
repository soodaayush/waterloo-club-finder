// Server-only: figures out when each org's JSON file was first added, from
// git history, so cards can show a "New" badge for recently-added orgs. Never
// import this from a client component (child_process isn't available there).
import { execSync } from "node:child_process";
import { daysSince } from "@/lib/date";

const NEW_WITHIN_DAYS = 21;
const ORGS_PATH = "data/orgs";

let cache: Map<string, string> | null = null;

function isShallowClone(): boolean {
  try {
    const out = execSync("git rev-parse --is-shallow-repository", {
      cwd: process.cwd(),
      encoding: "utf-8",
    }).trim();
    return out === "true";
  } catch {
    // Can't tell - assume shallow so we don't risk every org looking "new".
    return true;
  }
}

function computeAddedDates(): Map<string, string> {
  const map = new Map<string, string>();

  // A shallow checkout (common in CI/deploy) only has one commit, in which
  // every file looks newly "added" - better to show no badges than wrong ones.
  if (isShallowClone()) return map;

  try {
    const out = execSync(
      `git log --diff-filter=A --name-only --format=COMMIT:%ad --date=short -- ${ORGS_PATH}`,
      { cwd: process.cwd(), encoding: "utf-8" }
    );

    let currentDate: string | null = null;
    const prefix = `${ORGS_PATH}/`;
    for (const line of out.split("\n")) {
      if (line.startsWith("COMMIT:")) {
        currentDate = line.slice("COMMIT:".length).trim();
      } else if (
        currentDate &&
        line.startsWith(prefix) &&
        line.endsWith(".json")
      ) {
        const slug = line.slice(prefix.length, -".json".length);
        // git log lists newest commits first; keep overwriting so the final
        // value (from the oldest commit touching this file) wins.
        map.set(slug, currentDate);
      }
    }
  } catch {
    // Not a git checkout, or git isn't on PATH - no "new" badges.
  }

  return map;
}

function addedDates(): Map<string, string> {
  if (!(cache && process.env.NODE_ENV === "production")) {
    cache = computeAddedDates();
  }
  return cache;
}

function isNew(added: string | undefined): boolean {
  if (!added) return false;
  const days = daysSince(added);
  return days !== null && days >= 0 && days <= NEW_WITHIN_DAYS;
}

/** True if this org's file was added to the dataset within the last 3 weeks. */
export function isNewOrg(slug: string): boolean {
  return isNew(addedDates().get(slug));
}

/**
 * Slugs of orgs added within the last 3 weeks. Prefer this over filtering a
 * list with isNewOrg in a loop: addedDates() isn't cached outside production
 * (so edits made mid dev-session are picked up), which means each call reruns
 * a full `git log` - calling it once per org instead of once per render.
 */
export function newOrgSlugs(orgs: { slug: string }[]): string[] {
  const added = addedDates();
  return orgs.filter((o) => isNew(added.get(o.slug))).map((o) => o.slug);
}
