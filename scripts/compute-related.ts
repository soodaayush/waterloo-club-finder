/**
 * Computes a description/tag embedding for every org with a small local
 * model (no network call at request time - this runs once, by hand or in
 * CI, never per visitor) and writes the top semantic neighbours for each
 * org to data/related.json.
 *
 * This never overrides lib/orgUtils.ts#relatedOrgs' explicit shared-tag
 * rule - it only fills remaining slots when that rule comes up short, since
 * tag overlap is the thing a maintainer can actually read and reason about.
 * Treat this file as generated: re-run after editing data/orgs/*.json.
 *
 *   npm run compute-related
 */
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "@huggingface/transformers";
import { getAllOrgs } from "../lib/getOrgs";

const OUTPUT_PATH = path.join(process.cwd(), "data", "related.json");
const MODEL = "Xenova/all-MiniLM-L6-v2";
// A few more than orgUtils.ts's default `limit` (4), so there's room to
// drop candidates relatedOrgs' tag rule already surfaced.
const NEIGHBORS_PER_ORG = 8;

function orgText(org: { name: string; description: string; tags: string[] }): string {
  return `${org.name}. ${org.description}${
    org.tags.length ? ` Tags: ${org.tags.join(", ")}.` : ""
  }`;
}

// Embeddings from the pipeline below are L2-normalized, so the dot product
// of two of them is already the cosine similarity.
function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

async function main() {
  const orgs = getAllOrgs();
  console.log(`Embedding ${orgs.length} orgs with ${MODEL}...`);

  const extractor = await pipeline("feature-extraction", MODEL);

  const embeddings = new Map<string, Float32Array>();
  for (const org of orgs) {
    const output = await extractor(orgText(org), {
      pooling: "mean",
      normalize: true,
    });
    embeddings.set(org.slug, output.data as Float32Array);
  }

  const related: Record<string, string[]> = {};
  for (const org of orgs) {
    const vec = embeddings.get(org.slug)!;
    related[org.slug] = orgs
      .filter((o) => o.slug !== org.slug)
      .map((o) => ({ slug: o.slug, score: dot(vec, embeddings.get(o.slug)!) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, NEIGHBORS_PER_ORG)
      .map((x) => x.slug);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(related, null, 2) + "\n");
  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
