import { todayISO } from "@/lib/date";

// Override with the NEXT_PUBLIC_GITHUB_REPO env var (owner/repo) if the repo
// ever moves. Used to build "Edit on GitHub" deep links.
export const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO ?? "soodaayush/waterloo-club-finder";

export function getEditOrgUrl(slug: string): string {
  return `https://github.com/${GITHUB_REPO}/edit/main/data/orgs/${slug}.json`;
}

function newOrgTemplate() {
  return {
    slug: "your-club-slug",
    name: "Your Club Name",
    category: "Club",
    description: "One or two sentences describing the club or design team.",
    links: { website: null, instagram: null, discord: null },
    tags: [],
    cycles: [
      {
        term: "Fall 2026",
        status: "Upcoming",
        opensAt: null,
        closesAt: null,
        applyUrl: null,
        notes: null,
        lastVerified: todayISO(),
        source: "Community",
      },
    ],
  };
}

export function getNewOrgUrl(): string {
  const params = new URLSearchParams({
    filename: "data/orgs/your-club-slug.json",
    value: JSON.stringify(newOrgTemplate(), null, 2) + "\n",
  });
  return `https://github.com/${GITHUB_REPO}/new/main?${params.toString()}`;
}
