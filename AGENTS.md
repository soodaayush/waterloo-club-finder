<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Working on this repo

- Verify before you finish: `npm run validate-data`, `npm run lint`,
  `npm run build`. Show the output rather than asserting it passed.
- Data-health checks: `npm run check-links` (fast, HTTP status of every
  `website` / `applyUrl` plus staleness) and `npm run audit-sites` (slow,
  renders every site with Chrome to catch hijacked / parked / spam domains
  like a lapsed team domain turning into a casino page).
- Don't commit or push unless asked. When asked, branch off `main` first
  unless told otherwise.
- Site copy and data `notes`: no em dashes, and no AI-tell hedging
  ("appears to", "at verification time", "Flagging for review"). Write like a
  person taking quick notes.
- Checking whether a team is real and active: their own site is the source of
  truth, but many are JS apps that a plain fetch can't read. Use
  `npm run render <url> -- --text` (or `--links`) to get the rendered page.
  Instagram and Discord block bots, and `uwaterloo.ca/sedra-...` directory
  pages are often years stale. Cross-check before trusting or removing an
  entry. Lapsed domains sometimes turn into spam, so read what actually loads.
- Verifying a UI change: `npm run render http://localhost:3000/<path> -- --screenshot out.png`
  against a running dev server, then look at the file.

# Club data guidelines

The dataset in `data/orgs/*.json` tracks **general / new-member recruitment**,
the "how do I join this?" question a student (often a first-year) is asking.
That is what a cycle's `status` / `opensAt` / `closesAt` describe.

- Takes new members year-round with no form → `Rolling`. Set a cycle's
  `applyUrl` if there's a form to submit anytime; leave it null if joining is
  "show up / join the Discord" (the badge then reads "Open to join").
- New-member intake has a real window → `Open` / `Upcoming` / `Closed` with
  the dates.
- **Exec / lead / volunteer hiring is not tracked in `status`.** Mention it in
  `notes` ("Exec applications open until Sep 5") but the club's `status` stays
  whatever general membership is. Setting a club to `Open` because leadership
  hiring opened would mislead the people this site is for.
- If a team genuinely runs a structured exec-hiring cycle worth surfacing with
  dates, add it as a **separate cycle** with a distinct `term`, e.g.
  `"Fall 2026 exec hiring"`. This is opt-in, not the default.

`disciplines` is the skill axis students browse and filter by (Mechanical,
Electrical, Firmware, Software, Civil, Science, Business). Pick the 1 to 5 a
member would actually build with. Domain (robotics, aerospace, cars, fintech)
goes in `tags`, not here. `disciplines` plus `tags` also drive the "Related
teams" list on each page.
