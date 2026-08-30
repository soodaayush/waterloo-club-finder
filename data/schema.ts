import { z } from "zod";

export const CategoryEnum = z.enum(["DesignTeam", "Club", "CaseComp", "Other"]);
export type Category = z.infer<typeof CategoryEnum>;

export const StatusEnum = z.enum(["Upcoming", "Open", "Closed", "Rolling"]);
export type Status = z.infer<typeof StatusEnum>;

export const SourceEnum = z.enum(["Manual", "Community", "Scraped"]);
export type Source = z.infer<typeof SourceEnum>;

// The kind of work a member actually does, as a skill axis a student browses
// by ("I'm good at embedded", "I want to touch mechanical"). Domain (robotics,
// aerospace, cars) lives in `tags`, not here.
export const DisciplineEnum = z.enum([
  "Mechanical",
  "Electrical",
  "Firmware",
  "Software",
  "Civil",
  "Science",
  "Business",
]);
export type Discipline = z.infer<typeof DisciplineEnum>;

/**
 * An `https://` URL. Rejects `http:`, `javascript:`, `data:`, and anything
 * else. Every URL in this dataset is rendered as a clickable link or an
 * "Apply now" button, so a bad scheme here is a way to point users somewhere
 * hostile. Reviewers still have to check *where* a link goes; this only
 * guarantees it's a plain web link.
 */
const httpsUrl = z
  .string()
  .url()
  .refine((u) => {
    try {
      return new URL(u).protocol === "https:";
    } catch {
      return false;
    }
  }, "must be an https:// URL");

/** An `https://` URL whose host is (a subdomain of) one of `hosts`. */
function hostUrl(...hosts: string[]) {
  return httpsUrl.refine((u) => {
    const host = new URL(u).hostname.replace(/^www\./, "");
    return hosts.some((h) => host === h || host.endsWith(`.${h}`));
  }, `must link to ${hosts.join(" or ")}`);
}

export const CycleSchema = z.object({
  term: z.string().min(1),
  // Reflects GENERAL / new-member recruitment only, the "how do I join?"
  // question. Exec/lead/volunteer hiring goes in `notes`, never `status`
  // (or, if it needs dates, its own cycle with a distinct `term`).
  // See "Club data guidelines" in AGENTS.md.
  status: StatusEnum,
  opensAt: z.string().date().nullable(),
  closesAt: z.string().date().nullable(),
  applyUrl: httpsUrl.nullable(),
  notes: z.string().max(600).nullable(),
  lastVerified: z.string().date(),
  source: SourceEnum.default("Manual"),
});
export type Cycle = z.infer<typeof CycleSchema>;

export const LinksSchema = z.object({
  website: httpsUrl.nullable(),
  instagram: hostUrl("instagram.com").nullable(),
  discord: hostUrl("discord.gg", "discord.com").nullable(),
});
export type Links = z.infer<typeof LinksSchema>;

export const OrgSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be kebab-case"),
  name: z.string().min(1).max(120),
  category: CategoryEnum,
  description: z.string().min(1).max(400),
  links: LinksSchema,
  disciplines: z.array(DisciplineEnum).min(1).max(5),
  tags: z.array(z.string().min(1).max(30)).max(12).default([]),
  cycles: z.array(CycleSchema).min(1),
});
export type Org = z.infer<typeof OrgSchema>;
