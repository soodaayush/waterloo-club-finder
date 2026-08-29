/**
 * Render a page with headless Chrome and print (or screenshot) the result.
 * Most club sites are JavaScript apps that a plain `fetch` / `curl` can't
 * read; this runs the JS first. Also useful for eyeballing a UI change on
 * the dev server.
 *
 *   npm run render <url>                     rendered HTML
 *   npm run render <url> -- --text           visible text only
 *   npm run render <url> -- --links          every external link on the page
 *   npm run render <url> -- --screenshot a.png
 *   npm run render <url> -- --wait 12000     ms to let async JS settle (default 8000)
 *
 * Needs Chrome or Chromium on PATH, at a standard location, or at $CHROME_PATH.
 * No npm dependency, so it works even when node_modules is locked down.
 */
import { renderHtml, screenshot, htmlToText, htmlLinks } from "./lib/chrome";

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const url = process.argv.slice(2).find((a) => /^https?:\/\//.test(a));
  if (!url) {
    console.error(
      "usage: npm run render <url> -- [--text | --links | --screenshot out.png] [--wait ms]"
    );
    process.exit(1);
  }

  const waitMs = Number(flag("--wait") ?? 8000);

  const out = flag("--screenshot");
  if (out) {
    console.log(`screenshot -> ${await screenshot(url, out, waitMs)}`);
    return;
  }

  const html = await renderHtml(url, waitMs);
  if (process.argv.includes("--links")) console.log(htmlLinks(html).join("\n"));
  else if (process.argv.includes("--text")) console.log(htmlToText(html));
  else console.log(html);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
