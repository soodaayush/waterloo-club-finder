import fs from "node:fs";
import path from "node:path";
import { Org, OrgSchema } from "@/data/schema";

const ORGS_DIR = path.join(process.cwd(), "data", "orgs");

let cache: Org[] | null = null;

export function getAllOrgs(): Org[] {
  if (cache && process.env.NODE_ENV === "production") return cache;

  const files = fs.readdirSync(ORGS_DIR).filter((f) => f.endsWith(".json"));

  const orgs = files.map((file) => {
    const raw = fs.readFileSync(path.join(ORGS_DIR, file), "utf-8");
    const json = JSON.parse(raw);
    const result = OrgSchema.safeParse(json);
    if (!result.success) {
      throw new Error(
        `Invalid org data in data/orgs/${file}: ${result.error.message}`
      );
    }
    if (result.data.slug + ".json" !== file) {
      throw new Error(
        `Org slug "${result.data.slug}" does not match filename data/orgs/${file}`
      );
    }
    return result.data;
  });

  const slugs = new Set<string>();
  for (const org of orgs) {
    if (slugs.has(org.slug)) {
      throw new Error(`Duplicate org slug found: ${org.slug}`);
    }
    slugs.add(org.slug);
  }

  cache = orgs.sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}

export function getOrgBySlug(slug: string): Org | undefined {
  return getAllOrgs().find((org) => org.slug === slug);
}
