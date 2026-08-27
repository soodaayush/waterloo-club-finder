import { z } from "zod";

export const CategoryEnum = z.enum(["DesignTeam", "Club", "CaseComp", "Other"]);
export type Category = z.infer<typeof CategoryEnum>;

export const StatusEnum = z.enum(["Upcoming", "Open", "Closed", "Rolling"]);
export type Status = z.infer<typeof StatusEnum>;

export const SourceEnum = z.enum(["Manual", "Community", "Scraped"]);
export type Source = z.infer<typeof SourceEnum>;

export const CycleSchema = z.object({
  term: z.string().min(1),
  status: StatusEnum,
  opensAt: z.string().date().nullable(),
  closesAt: z.string().date().nullable(),
  applyUrl: z.string().url().nullable(),
  notes: z.string().nullable(),
  lastVerified: z.string().date(),
  source: SourceEnum.default("Manual"),
});
export type Cycle = z.infer<typeof CycleSchema>;

export const LinksSchema = z.object({
  website: z.string().url().nullable(),
  instagram: z.string().url().nullable(),
  discord: z.string().url().nullable(),
});
export type Links = z.infer<typeof LinksSchema>;

export const OrgSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be kebab-case"),
  name: z.string().min(1),
  category: CategoryEnum,
  description: z.string().min(1),
  links: LinksSchema,
  tags: z.array(z.string()).default([]),
  cycles: z.array(CycleSchema).min(1),
});
export type Org = z.infer<typeof OrgSchema>;
