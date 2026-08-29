/**
 * Renders every org's `website` with headless Chrome and flags the ones that
 * look wrong: hijacked / parked / spam domains, near-empty pages, and pages
 * that never mention the team or Waterloo. This is the slow, thorough check
 * (a Chrome render per site); `npm run check-links` is the fast HTTP one.
 *
 *   npm run audit-sites
 *
 * It reads, never writes. Review each flag by hand before changing data.
 */
import fs from "node:fs";
import path from "node:path";
import { renderHtml, htmlToText } from "./lib/chrome";

const ORGS_DIR = path.join(process.cwd(), "data", "orgs");
const CONCURRENCY = 4;
const MIN_TEXT = 200;
const WAIT_MS = 9000;

const SPAM =
  /\b(casino|betting|sportsbook|no[- ]?deposit bonus|free spins|payday loan|forex|binary options|viagra|cialis|escort service|adult dating|domain (is )?for sale|buy this domain|this domain (is|may be) for sale|parked free|godaddy|hugedomains|porn)\b/i;

type Org = {
  slug: string;
  name: string;
  links: { website: string | null };
};

type Flag = { slug: string; url: string; reasons: string[]; snippet: string };

function keywordsFor(org: Org): string[] {
  const words = [
    ...org.name.toLowerCase().split(/[^a-z0-9]+/),
    ...org.slug.split("-"),
  ].filter((w) => w.length > 3 && w !== "team" && w !== "design" && w !== "waterloo");
  return [...new Set(["waterloo", ...words])];
}

/** The team's official Sedra directory page, not a site they built. */
function isSedraPage(url: string): boolean {
  return /uwaterloo\.ca\/sedra-student-design-centre\//.test(url);
}

/** Chrome's "this page couldn't load" interstitial, not the real site. */
function isChromeError(text: string): boolean {
  return /this page (couldn.t|could not) load|ERR_|reload to try again/i.test(text);
}

/** Raw HTML via a plain request, for when headless Chrome can't render a site. */
async function plainFetch(url: string): Promise<string> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    return (await res.text()).slice(0, 200000);
  } catch {
    return "";
  }
}

async function main() {
  const orgs: Org[] = fs
    .readdirSync(ORGS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(ORGS_DIR, f), "utf-8")));

  const noSite = orgs.filter((o) => !o.links.website).map((o) => o.slug).sort();
  const officialPage = orgs
    .filter((o) => o.links.website && isSedraPage(o.links.website))
    .map((o) => o.slug);
  const toRender = orgs.filter(
    (o) => o.links.website && !isSedraPage(o.links.website)
  );

  const flags: Flag[] = [];
  let clean = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < toRender.length) {
      const org = toRender[cursor++];
      const url = org.links.website!;
      const reasons: string[] = [];
      let text = "";
      try {
        text = htmlToText(await renderHtml(url, WAIT_MS)).slice(0, 20000);
        if (isChromeError(text) || text.length < MIN_TEXT) {
          // one retry with a longer budget for slow sites
          text = htmlToText(await renderHtml(url, WAIT_MS + 8000)).slice(0, 20000);
        }
      } catch (err) {
        text = `render error: ${(err as Error).message}`;
      }

      if (isChromeError(text) || text.startsWith("render error:")) {
        // Some heavy SPAs never finish in headless Chrome. Fall back to the
        // raw HTML (title, meta, inlined data) so a working site isn't flagged
        // as a hijack. We can only really tell "on-topic" vs "spam" this way.
        const rawHtml = (await plainFetch(url)).toLowerCase();
        const spam = rawHtml.match(SPAM);
        if (!rawHtml) {
          reasons.push("headless Chrome failed and a plain fetch got nothing");
        } else if (spam) {
          reasons.push(`headless Chrome failed; raw HTML has spam keyword "${spam[0]}"`);
        } else if (!keywordsFor(org).some((k) => rawHtml.includes(k))) {
          reasons.push("headless Chrome failed; raw HTML never mentions Waterloo or the team");
        }
        if (reasons.length) {
          flags.push({ slug: org.slug, url, reasons, snippet: "" });
        } else {
          clean++;
        }
        continue;
      }

      const lower = text.toLowerCase();
      const spam = text.match(SPAM);
      if (spam) reasons.push(`spam / parked keyword: "${spam[0]}"`);
      if (text.length < MIN_TEXT) reasons.push(`almost no content (${text.length} chars)`);
      if (!keywordsFor(org).some((k) => lower.includes(k))) {
        reasons.push("never mentions Waterloo or the team name");
      }

      if (reasons.length) {
        flags.push({
          slug: org.slug,
          url,
          reasons,
          snippet: text.slice(0, 220),
        });
      } else {
        clean++;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  flags.sort((a, b) => a.slug.localeCompare(b.slug));

  const stamp = new Date().toISOString().slice(0, 10);
  const out: string[] = [`Rendered ${toRender.length} sites on ${stamp}.`, ""];

  if (flags.length) {
    out.push(`## Needs a look (${flags.length})`, "");
    for (const f of flags) {
      out.push(`### ${f.slug}  ${f.url}`);
      for (const r of f.reasons) out.push(`- ${r}`);
      if (f.snippet) out.push("", `> ${f.snippet}`);
      out.push("");
    }
  } else {
    out.push(`All ${toRender.length} independent sites look on-topic.`, "");
  }

  out.push(`## Official UW / Sedra page, not an independent site (${officialPage.length})`, "");
  out.push(officialPage.sort().join(", ") || "(none)", "");
  out.push(`## No website, relying on socials or Sedra (${noSite.length})`, "");
  out.push(noSite.join(", ") || "(none)", "");
  out.push(`\n${clean} independent sites rendered clean.`);

  const report = out.join("\n");
  fs.writeFileSync("site-audit.md", report + "\n");
  process.stdout.write(report + "\n");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
