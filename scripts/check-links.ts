/**
 * Link health check. Reads every org file, requests each `website` and
 * `applyUrl`, and reports the ones that are broken or that nobody has
 * re-verified in a while. It never edits data. The GitHub Action in
 * `.github/workflows/link-check.yml` runs this daily and files the report
 * as a single issue.
 *
 * Run locally: `npm run check-links`
 */
import fs from "node:fs";
import path from "node:path";

const ORGS_DIR = path.join(process.cwd(), "data", "orgs");
const STALE_DAYS = 90;
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;
const UA =
  "Mozilla/5.0 (compatible; waterloo-club-finder link check; +https://waterloo-club-finder.vercel.app)";

type Target = { slug: string; kind: string; url: string };
type Finding = Target & { severity: "dead" | "warn"; detail: string };

/** "warn" = probably fine but a bot got blocked, look yourself. "dead" = real problem. */
async function checkUrl(url: string): Promise<Finding["detail"] | { ok: true } | { warn: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,*/*" },
    });
    if (res.ok) return { ok: true };
    if ([401, 403, 429, 503].includes(res.status)) {
      return { warn: `HTTP ${res.status} (bot-blocked from CI, check by hand)` };
    }
    return `HTTP ${res.status}`;
  } catch (err) {
    const e = err as Error & { cause?: { code?: string } };
    if (e.name === "AbortError") return { warn: "timed out after 15s" };
    return e.cause?.code ?? e.message;
  } finally {
    clearTimeout(timer);
  }
}

function daysSince(isoDate: string): number {
  const then = new Date(`${isoDate}T00:00:00Z`).getTime();
  return Math.floor((Date.now() - then) / 86_400_000);
}

async function main() {
  const files = fs.readdirSync(ORGS_DIR).filter((f) => f.endsWith(".json"));
  const orgs = files.map(
    (f) => JSON.parse(fs.readFileSync(path.join(ORGS_DIR, f), "utf-8")) as {
      slug: string;
      links: { website: string | null };
      cycles: { term: string; applyUrl: string | null; lastVerified: string }[];
    }
  );

  const targets: Target[] = [];
  const stale: { slug: string; term: string; lastVerified: string; days: number }[] = [];

  for (const org of orgs) {
    if (org.links.website) {
      targets.push({ slug: org.slug, kind: "website", url: org.links.website });
    }
    for (const cycle of org.cycles) {
      if (cycle.applyUrl) {
        targets.push({ slug: org.slug, kind: `applyUrl (${cycle.term})`, url: cycle.applyUrl });
      }
      const days = daysSince(cycle.lastVerified);
      if (days > STALE_DAYS) {
        stale.push({ slug: org.slug, term: cycle.term, lastVerified: cycle.lastVerified, days });
      }
    }
  }

  const findings: Finding[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const target = targets[cursor++];
      const result = await checkUrl(target.url);
      if (typeof result === "string") {
        findings.push({ ...target, severity: "dead", detail: result });
      } else if ("warn" in result) {
        findings.push({ ...target, severity: "warn", detail: result.warn });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const dead = findings.filter((f) => f.severity === "dead").sort(bySlug);
  const warn = findings.filter((f) => f.severity === "warn").sort(bySlug);
  stale.sort((a, b) => b.days - a.days);

  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [];

  if (!dead.length && !warn.length && !stale.length) {
    out.push(`Checked ${orgs.length} orgs on ${stamp}. No broken links, nothing stale.`);
  } else {
    out.push(`Checked ${orgs.length} orgs on ${stamp}.`, "");
    if (dead.length) {
      out.push(`## Broken links (${dead.length})`, "");
      for (const f of dead) out.push(`- **${f.slug}** ${f.kind}: ${f.url} (${f.detail})`);
      out.push("");
    }
    if (warn.length) {
      out.push(`## Check by hand (${warn.length})`, "");
      for (const f of warn) out.push(`- **${f.slug}** ${f.kind}: ${f.url} (${f.detail})`);
      out.push("");
    }
    if (stale.length) {
      out.push(`## Not verified in ${STALE_DAYS}+ days (${stale.length})`, "");
      for (const s of stale) {
        out.push(`- **${s.slug}** "${s.term}" last verified ${s.lastVerified} (${s.days} days ago)`);
      }
      out.push("");
    }
  }

  const report = out.join("\n").trimEnd() + "\n";
  fs.writeFileSync("link-report.md", report);
  process.stdout.write(report);
}

function bySlug(a: { slug: string }, b: { slug: string }) {
  return a.slug.localeCompare(b.slug);
}

main();
