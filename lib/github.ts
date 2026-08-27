// Update this once the project is pushed to GitHub (owner/repo), or set the
// NEXT_PUBLIC_GITHUB_REPO env var. Used to build "Edit on GitHub" deep links.
export const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO ?? "YOUR_GITHUB_USERNAME/waterloo-club-finder";

export function getEditOrgUrl(slug: string): string {
  return `https://github.com/${GITHUB_REPO}/edit/main/data/orgs/${slug}.json`;
}

const NEW_ORG_TEMPLATE = {
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
      lastVerified: new Date().toISOString().slice(0, 10),
      source: "Community",
    },
  ],
};

export function getNewOrgUrl(): string {
  const params = new URLSearchParams({
    filename: "data/orgs/your-club-slug.json",
    value: JSON.stringify(NEW_ORG_TEMPLATE, null, 2) + "\n",
  });
  return `https://github.com/${GITHUB_REPO}/new/main?${params.toString()}`;
}
