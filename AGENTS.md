<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Club data guidelines

The dataset in `data/orgs/*.json` tracks **general / new-member recruitment** —
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
  `"Fall 2026 — Exec hiring"`. This is opt-in, not the default.

`disciplines` is the skill axis students browse and filter by (Mechanical,
Electrical, Firmware, Software, Civil, Science, Business) — pick the 1–5 a
member would actually build with. Domain (robotics, aerospace, cars, fintech)
goes in `tags`, not here. `disciplines` + `tags` also drive the "Related
teams" list on each page.
