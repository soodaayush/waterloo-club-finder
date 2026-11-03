/**
 * Re-verifies stale orgs against their real website and drafts a PR with
 * what it finds - it never writes to data/orgs/ directly or merges
 * anything. This is the "judgment" half of keeping the dataset fresh
 * (status/dates/notes), as opposed to npm run check-links / audit-sites,
 * which only do mechanical checks (is the link alive, does the site look
 * hijacked) and never touch data either.
 *
 *   ANTHROPIC_API_KEY=sk-... npm run reverify
 *   npm run reverify -- --limit 5      # fewer orgs, for a quick local test
 *   npm run reverify -- --dry-run      # print proposals, write nothing
 *
 * Safety model, since this project's own rule is "a wrong deadline is worse
 * than no deadline":
 *  - The model proposes; a human still has to open and merge the PR. This
 *    script never pushes to main and never auto-merges anything.
 *  - Every proposed change must come with `quotedEvidence`, a literal
 *    substring of the rendered page. If it isn't actually on the page, the
 *    proposal is thrown out before it ever reaches a file - a deterministic
 *    check, not something the model is just asked nicely to do.
 *  - A proposal whose own quoted evidence reads like exec/lead/volunteer
 *    hiring language gets dropped outright, never just downgraded - the
 *    house rule that status only ever reflects general recruitment is the
 *    single rule most worth a code-level backstop, not just a prompt
 *    instruction (see EXEC_HIRING_PATTERN below).
 *  - Missing or non-numeric confidence is treated as failing the threshold,
 *    not passing it - a malformed API response must fail closed.
 *  - Every written file is re-validated against OrgSchema before it's
 *    allowed to land, same as a human edit would be.
 *  - Orgs with no live website (Instagram/Discord-only teams) are skipped
 *    entirely - there's nothing this script can render to check them
 *    against, and this project has already decided not to scrape
 *    Instagram/Discord (see AGENTS.md).
 *  - Orgs with more than one cycle are skipped. AGENTS.md invites teams to
 *    add a second, opt-in cycle for exec hiring with its own `term` - this
 *    script only knows how to read/write "the latest cycle" and has no way
 *    to tell which cycle is the general one, so touching a multi-cycle org
 *    risks overwriting the wrong one.
 */
import fs from "node:fs";
import path from "node:path";
import { renderHtml, htmlToText } from "./lib/chrome";
import { OrgSchema, type Org } from "../data/schema";
import { daysSince, todayISO } from "../lib/date";
import { getLatestCycle } from "../lib/orgUtils";

const ORGS_DIR = path.join(process.cwd(), "data", "orgs");
const MODEL = "claude-sonnet-5";
const CONFIDENCE_THRESHOLD = 0.75;
const MAX_PAGE_CHARS = 6000;
const MAX_ORGS_PER_RUN = 15;
const MAX_EVIDENCE_CHARS = 300;
const MIN_EVIDENCE_CHARS = 20;
// Re-check sooner than the site's own public "stale" warning (isStale /
// STALE_AFTER_DAYS = 60 days in lib/date.ts) so a cycle gets a second look
// before a human visitor ever sees the amber "unverified since" badge on it.
const REVERIFY_AFTER_DAYS = 30;

// Deliberately broad and biased toward false negatives (skipping a real
// general-recruitment update) over false positives (writing an exec-hiring
// claim as if it were general recruitment) - the project's own stated
// tradeoff. Matched against the model's own quoted evidence, not the whole
// page, so a page that merely mentions exec roles elsewhere doesn't trip
// this when the quote itself is about general recruitment.
const EXEC_HIRING_PATTERN =
  /\b(exec(utive)?s?\b|vice[- ]president|\bvp\b|\bpresident\b|treasurer|\bdirector\b|\bchief\b|\bcaptain\b|\bcoordinator\b|committee member|lead(ership)? (team|hiring|application|position|role)|hiring (for )?(our )?(exec|lead|leadership))/i;

const HOUSE_RULES = `
House rules for this dataset (from AGENTS.md - follow them exactly):
- status/opensAt/closesAt/applyUrl describe GENERAL new-member recruitment
  only - the "how do I join?" question a student is asking. Never propose a
  change based on exec/lead/volunteer/committee hiring; if the page is about
  that, set hasChange to false. General recruitment and exec hiring are
  often announced on the same page - read carefully which one your quoted
  evidence is actually about.
- "Rolling": takes new members year-round with no form. Set applyUrl if
  there's a form to submit anytime; leave it null if joining is "show up /
  join the Discord."
- "Upcoming" / "Open" / "Closed": intake has a real window, with dates.
- notes: no em dashes, no AI-tell hedging ("appears to", "at verification
  time", "flagging for review"). Write like a person taking quick notes.
  Max 600 characters. Write a complete replacement for the notes field, not
  a diff or an addition to the old one.
`.trim();

type Candidate = { file: string; org: Org };

type Proposal = {
  hasChange: boolean;
  status?: "Upcoming" | "Open" | "Closed" | "Rolling" | null;
  opensAt?: string | null;
  closesAt?: string | null;
  applyUrl?: string | null;
  notes?: string | null;
  confidence: number;
  quotedEvidence: string;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const limitFlag = args.indexOf("--limit");
  return {
    dryRun: args.includes("--dry-run"),
    limit:
      limitFlag !== -1 && args[limitFlag + 1]
        ? Number(args[limitFlag + 1])
        : MAX_ORGS_PER_RUN,
  };
}

function loadCandidates(): Candidate[] {
  const files = fs.readdirSync(ORGS_DIR).filter((f) => f.endsWith(".json"));
  const candidates: Candidate[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(ORGS_DIR, file), "utf-8");
    const org: Org = JSON.parse(raw);
    if (!org.links.website) continue; // nothing to render
    if (org.cycles.length > 1) continue; // see the multi-cycle note up top
    const cycle = getLatestCycle(org);
    const days = daysSince(cycle.lastVerified);
    if (days === null || days <= REVERIFY_AFTER_DAYS) continue;
    candidates.push({ file, org });
  }

  // Oldest-verified first, so the most overdue orgs get priority when a run
  // is capped by --limit.
  candidates.sort((a, b) =>
    getLatestCycle(a.org).lastVerified.localeCompare(
      getLatestCycle(b.org).lastVerified
    )
  );
  return candidates;
}

async function callClaude(
  org: Org,
  pageText: string
): Promise<Proposal | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }

  const cycle = getLatestCycle(org);
  const tool = {
    name: "propose_update",
    description:
      "Propose an update to this org's current application cycle, based only on the rendered page text given.",
    input_schema: {
      type: "object",
      properties: {
        hasChange: {
          type: "boolean",
          description:
            "true only if the page gives clear evidence that GENERAL-recruitment status, opensAt, closesAt, or applyUrl should change from what's currently recorded. False if the only evidence is about exec/lead/volunteer/committee hiring.",
        },
        status: {
          type: ["string", "null"],
          enum: ["Upcoming", "Open", "Closed", "Rolling", null],
        },
        opensAt: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
        closesAt: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
        applyUrl: { type: ["string", "null"], description: "https:// URL or null" },
        notes: {
          type: ["string", "null"],
          description: "complete replacement notes text, house style, max 600 chars",
        },
        confidence: {
          type: "number",
          description: "0 to 1, how confident you are hasChange is correct",
        },
        quotedEvidence: {
          type: "string",
          description: `a literal substring, copied exactly, from the rendered page text below that supports hasChange - about general recruitment specifically, not exec/lead hiring. Under ${MAX_EVIDENCE_CHARS} characters. Empty string if hasChange is false.`,
        },
      },
      required: ["hasChange", "confidence", "quotedEvidence"],
    },
  };

  const prompt = `${HOUSE_RULES}

Org: ${org.name} (${org.slug})
Currently recorded cycle: ${JSON.stringify(cycle, null, 2)}

Rendered text of ${org.links.website}, today:
"""
${pageText.slice(0, MAX_PAGE_CHARS)}
"""

Decide whether the currently recorded cycle is still accurate. Call propose_update.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1536,
      tools: [tool],
      tool_choice: { type: "tool", name: "propose_update" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((b: { type: string }) => b.type === "tool_use");
  if (!toolUse) return null;
  return toolUse.input as Proposal;
}

/**
 * The deterministic guards: the model's claim has to actually be on the
 * page, has to be a real sentence rather than page boilerplate, can't be
 * longer than makes sense for a short quote, and can't itself read like
 * exec/lead hiring language. All four fail closed (reject on any doubt).
 */
function evidenceIsUsable(proposal: Proposal, pageText: string): boolean {
  const quote = proposal.quotedEvidence;
  if (!quote) return false;
  if (quote.length < MIN_EVIDENCE_CHARS || quote.length > MAX_EVIDENCE_CHARS) {
    return false;
  }
  if (!pageText.toLowerCase().includes(quote.toLowerCase())) return false;
  if (EXEC_HIRING_PATTERN.test(quote)) return false;
  return true;
}

function hasValidConfidence(proposal: Proposal): boolean {
  return (
    typeof proposal.confidence === "number" &&
    Number.isFinite(proposal.confidence) &&
    proposal.confidence >= CONFIDENCE_THRESHOLD
  );
}

async function main() {
  const { dryRun, limit } = parseArgs();
  const candidates = loadCandidates().slice(0, limit);

  if (candidates.length === 0) {
    console.log("Nothing stale enough to re-check right now.");
    return;
  }

  console.log(`Re-checking ${candidates.length} stale org(s)...`);
  const changed: { file: string; org: Org; proposal: Proposal }[] = [];
  const skipped: { slug: string; reason: string }[] = [];

  for (const { file, org } of candidates) {
    const url = org.links.website!;
    process.stdout.write(`  ${org.slug} ... `);
    let pageText: string;
    try {
      pageText = htmlToText(await renderHtml(url, 9000)).slice(0, 20000);
    } catch (err) {
      console.log(`render failed (${(err as Error).message})`);
      skipped.push({ slug: org.slug, reason: "render failed" });
      continue;
    }
    if (pageText.length < 100) {
      console.log("page too empty to read, skipping");
      skipped.push({ slug: org.slug, reason: "page too empty" });
      continue;
    }

    let proposal: Proposal | null;
    try {
      proposal = await callClaude(org, pageText);
    } catch (err) {
      console.log(`API call failed (${(err as Error).message})`);
      skipped.push({ slug: org.slug, reason: "API call failed" });
      continue;
    }

    if (!proposal || !proposal.hasChange) {
      console.log("no change proposed");
      continue;
    }
    if (!hasValidConfidence(proposal)) {
      console.log(`confidence missing or below threshold (${proposal.confidence}), skipping`);
      skipped.push({ slug: org.slug, reason: `low/invalid confidence (${proposal.confidence})` });
      continue;
    }
    if (!evidenceIsUsable(proposal, pageText)) {
      console.log("quoted evidence unverifiable or reads like exec/lead hiring, skipping");
      skipped.push({ slug: org.slug, reason: "evidence failed the usability guard" });
      continue;
    }

    console.log(`proposing a change (confidence ${proposal.confidence})`);
    changed.push({ file, org, proposal });
  }

  if (changed.length === 0) {
    console.log("\nNo confident, evidence-backed changes this run.");
    if (skipped.length) {
      console.log("Skipped:", skipped.map((s) => `${s.slug} (${s.reason})`).join(", "));
    }
    return;
  }

  console.log(`\n${changed.length} org(s) with a proposed change:`);
  const prBody: string[] = [
    "Opened automatically by `npm run reverify` (scripts/reverify.ts).",
    "",
    "Every change below came with a quoted snippet that was checked against the real rendered page before this PR was opened - that doesn't mean it's right, read each one before merging.",
    "",
  ];

  for (const { file, org, proposal } of changed) {
    const cycle = getLatestCycle(org);
    const next = {
      ...cycle,
      ...(proposal.status !== undefined && proposal.status !== null
        ? { status: proposal.status }
        : {}),
      ...(proposal.opensAt !== undefined ? { opensAt: proposal.opensAt } : {}),
      ...(proposal.closesAt !== undefined ? { closesAt: proposal.closesAt } : {}),
      ...(proposal.applyUrl !== undefined ? { applyUrl: proposal.applyUrl } : {}),
      ...(proposal.notes !== undefined ? { notes: proposal.notes } : {}),
      lastVerified: todayISO(),
      source: "Scraped" as const,
    };

    const nextOrg: Org = {
      ...org,
      cycles: [...org.cycles.slice(0, -1), next],
    };

    const result = OrgSchema.safeParse(nextOrg);
    if (!result.success) {
      console.log(`  ${org.slug}: proposed update fails schema validation, skipping`);
      console.log(result.error.issues.map((i) => `    ${i.path.join(".")}: ${i.message}`).join("\n"));
      continue;
    }

    console.log(`  ${org.slug}: ${cycle.status} -> ${next.status}`);
    prBody.push(
      `### ${org.name} (\`${org.slug}\`)`,
      `Confidence: ${proposal.confidence}`,
      "",
      `> ${proposal.quotedEvidence}`,
      "",
      `Source: ${org.links.website}`,
      ""
    );

    if (!dryRun) {
      fs.writeFileSync(
        path.join(ORGS_DIR, file),
        JSON.stringify(result.data, null, 2) + "\n"
      );
    }
  }

  if (dryRun) {
    console.log("\n--dry-run: nothing written.");
  } else {
    fs.writeFileSync("reverify-pr-body.md", prBody.join("\n") + "\n");
    console.log("\nWrote reverify-pr-body.md for the workflow to use as the PR description.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
