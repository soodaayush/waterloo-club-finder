import fs from "node:fs";
import path from "node:path";
import { OrgSchema } from "../data/schema";

const ORGS_DIR = path.join(process.cwd(), "data", "orgs");

function main() {
  const files = fs.readdirSync(ORGS_DIR).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.error("No org files found in data/orgs, that's not expected.");
    process.exit(1);
  }

  let hasError = false;
  const slugs = new Set<string>();

  for (const file of files) {
    const filePath = path.join(ORGS_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      hasError = true;
      console.error(`✗ data/orgs/${file}: invalid JSON, ${(err as Error).message}`);
      continue;
    }

    const result = OrgSchema.safeParse(json);
    if (!result.success) {
      hasError = true;
      console.error(`✗ data/orgs/${file}:`);
      for (const issue of result.error.issues) {
        console.error(`    ${issue.path.join(".")}: ${issue.message}`);
      }
      continue;
    }

    if (result.data.slug + ".json" !== file) {
      hasError = true;
      console.error(
        `✗ data/orgs/${file}: slug "${result.data.slug}" does not match filename`
      );
      continue;
    }

    if (slugs.has(result.data.slug)) {
      hasError = true;
      console.error(`✗ data/orgs/${file}: duplicate slug "${result.data.slug}"`);
      continue;
    }
    slugs.add(result.data.slug);

    console.log(`✓ data/orgs/${file}`);
  }

  if (hasError) {
    console.error(`\n${files.length} file(s) checked, errors found above.`);
    process.exit(1);
  }

  console.log(`\nAll ${files.length} org file(s) valid.`);
}

main();
