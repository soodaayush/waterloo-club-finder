# Waterloo Club & Design Team Finder

One place to check application status across UWaterloo clubs and design
teams, instead of Instagram, Discord, and a dozen scattered websites.

## How it works

There's no database and no admin panel. Every club/design team is a JSON
file in [`data/orgs/`](data/orgs), validated against the schema in
[`data/schema.ts`](data/schema.ts). The Next.js site reads these files at
build time and statically generates every page.

- **Updates happen via GitHub pull requests.** Every club page has an "Edit
  on GitHub" link that opens GitHub's web editor (auto-forks the repo, no
  git experience needed) with that club's JSON file. See
  [`app/contribute/page.tsx`](app/contribute/page.tsx) / the live
  `/contribute` page for the full walkthrough.
- **CI validates every PR.** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
  runs `npm run validate-data` and `npm run build` on every pull request, so
  a malformed submission fails checks before it can be merged.
- **Deploying is just merging.** Once hosted on Vercel with auto-deploy on
  `main`, an approved PR going live is "click merge."

### Data model

Each file in `data/orgs/<slug>.json` looks like:

```jsonc
{
  "slug": "wat-ai",
  "name": "WAT.ai",
  "category": "DesignTeam", // DesignTeam | Club | CaseComp | Other
  "description": "...",
  "links": { "website": "...", "instagram": null, "discord": null },
  "tags": ["ai", "machine-learning"],
  "cycles": [
    {
      "term": "Fall 2026",
      "status": "Upcoming", // Upcoming | Open | Closed | Rolling
      "opensAt": null, // "YYYY-MM-DD" or null
      "closesAt": null,
      "applyUrl": null,
      "notes": "...",
      "lastVerified": "2026-08-27", // "YYYY-MM-DD", update whenever you touch this cycle
      "source": "Manual" // Manual | Community | Scraped
    }
  ]
}
```

The seed data (17 real Waterloo clubs/design teams) was populated from
public sources, but **deadlines are intentionally left unverified** rather
than guessed — a wrong deadline is worse than no deadline. Filling these in
as they're announced is the main way this project stays useful.

**A cycle tracks general / new-member recruitment only** — the "how do I
join?" question. Exec / lead / volunteer hiring goes in `notes`, never
`status`; if it needs its own dates, it gets its own cycle with a distinct
`term` (e.g. `"Fall 2026 — Exec hiring"`). Full rules in
[`AGENTS.md`](AGENTS.md#club-data-guidelines).

**Status is derived, not hand-maintained.** Once `opensAt` / `closesAt` are
set, [`effectiveStatus`](lib/orgUtils.ts) moves a cycle Upcoming → Open →
Closed on its own as those dates pass; the stored `status` is only a
fallback for `Rolling` or date-less cycles. The club pages use ISR
(`export const revalidate` in [`app/page.tsx`](app/page.tsx) and
[`app/clubs/[slug]/page.tsx`](app/clubs/[slug]/page.tsx)) so those
transitions and the "Nd left" countdowns refresh without a rebuild, and
[`.github/workflows/refresh.yml`](.github/workflows/refresh.yml) redeploys
nightly as a backstop (needs a `VERCEL_DEPLOY_HOOK_URL` secret).

Cycles whose `lastVerified` is more than `STALE_AFTER_DAYS`
([`lib/date.ts`](lib/date.ts)) old are flagged with an "⚠ Unverified since …"
note on the card and detail page, so old data visibly asks to be re-checked.

## Local development

```bash
npm install
npm run validate-data   # checks every file in data/orgs against the schema
npm run dev             # http://localhost:3000
npm run build            # production build (also run in CI)
```

## Deploying

1. Push this repo to GitHub.
2. `lib/github.ts` hard-codes the repo as `soodaayush/waterloo-club-finder`
   for the "Edit on GitHub" / "Add a new club" links. If the repo moves, set
   `NEXT_PUBLIC_GITHUB_REPO` (Vercel project settings or `.env.local`) to the
   new `owner/repo` instead of editing the file.
3. Import the repo into [Vercel](https://vercel.com/new) and deploy — no
   database or other services required. Enable auto-deploy on `main` so
   merged PRs go live automatically.

## Maintainer setup (do this before sharing the site widely)

Contributions are unrestricted pull requests, so the merge step is the only
gate. The schema check ([`data/schema.ts`](data/schema.ts)) enforces that
every URL is a plain `https://` link and that social links point at the
expected hosts, but it **cannot** tell a real application form from a hostile
look-alike. Lock down `main` so nothing lands without you looking:

On GitHub → **Settings → Branches → Add branch ruleset** for `main`:

- Require a pull request before merging
- Require review from Code Owners (uses [`.github/CODEOWNERS`](.github/CODEOWNERS))
- Require status checks to pass: `validate` (from `ci.yml`)
- Block force pushes; restrict who can push to `main` to maintainers only

On every data PR, the [`pr-data-review`](.github/workflows/pr-data-review.yml)
workflow lists the URLs it changes in the check summary — open each one before
approving.

## Project structure

```
app/
  page.tsx              Home: search + filter + urgency-sorted list
  clubs/[slug]/page.tsx  Club detail page, with "Edit on GitHub" link
  contribute/page.tsx    Explains the GitHub PR contribution flow
data/
  orgs/*.json            One file per club/design team (the "database")
  schema.ts              zod schema shared by the app and the validator
lib/
  getOrgs.ts             Server-only: reads + validates data/orgs
  orgUtils.ts            Client-safe helpers (sorting, latest cycle)
  github.ts              Builds "Edit on GitHub" / "Add a new club" links
  date.ts                Date formatting helpers
components/
  OrgBrowser.tsx         Search/filter UI + results grid (client component)
  OrgCard.tsx, StatusBadge.tsx
scripts/
  validate-data.ts       Standalone schema check, run locally and in CI
.github/
  workflows/ci.yml        Validates data + builds on every PR
  PULL_REQUEST_TEMPLATE.md
```

## Not in scope (by design)

- **No scraping of Instagram or Discord.** Both are private/ToS-restricted;
  the site links out to each club's actual accounts instead.
- **No accounts or email/SMS alerts.** A reasonable future addition, but the
  MVP solves "one page to check" first.
