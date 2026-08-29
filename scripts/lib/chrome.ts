/** Shared headless-Chrome helpers for the render and audit scripts. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const run = promisify(execFile);
const BUFFER = { maxBuffer: 64 * 1024 * 1024 };

export function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((p): p is string => Boolean(p));
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    "No Chrome/Chromium found. Install one or set CHROME_PATH to its binary."
  );
}

function commonArgs(waitMs: number): string[] {
  return [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--user-agent=Mozilla/5.0 (compatible; waterloo-club-finder render)",
    `--virtual-time-budget=${waitMs}`,
  ];
}

export async function renderHtml(url: string, waitMs = 8000): Promise<string> {
  const { stdout } = await run(
    findChrome(),
    [...commonArgs(waitMs), "--dump-dom", url],
    BUFFER
  );
  return stdout;
}

export async function screenshot(
  url: string,
  outPath: string,
  waitMs = 8000
): Promise<string> {
  const out = path.resolve(outPath);
  await run(
    findChrome(),
    [...commonArgs(waitMs), "--window-size=1280,900", `--screenshot=${out}`, url],
    BUFFER
  );
  return out;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlLinks(html: string): string[] {
  const found = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  return [...new Set(found)].sort();
}
