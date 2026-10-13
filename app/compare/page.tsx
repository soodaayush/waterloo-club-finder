import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Org } from "@/data/schema";
import { getOrgBySlug } from "@/lib/getOrgs";
import { formatDate } from "@/lib/date";
import { StatusBadge } from "@/components/StatusBadge";
import { LinkIcon, type LinkLabel } from "@/components/LinkIcon";
import { CATEGORY_LABEL, getLatestCycle } from "@/lib/orgUtils";

// A comparison depends entirely on which slugs are in the query string, so
// it's never worth indexing - the canonical page for each club is /clubs/[slug].
export const metadata: Metadata = {
  title: "Compare",
  robots: { index: false, follow: true },
};

function Row({
  label,
  cells,
}: {
  label: string;
  cells: ReactNode[];
}) {
  return (
    <tr className="divide-x divide-border border-t border-border">
      <th
        scope="row"
        className="sticky left-0 z-10 w-28 bg-background py-3 pl-4 pr-3 text-left align-top text-xs font-medium whitespace-nowrap text-foreground/50 sm:w-36"
      >
        {label}
      </th>
      {cells.map((cell, i) => (
        <td key={i} className="px-4 py-3 align-top text-sm">
          {cell}
        </td>
      ))}
    </tr>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ slugs?: string }>;
}) {
  const { slugs: slugsParam } = await searchParams;
  const slugs = [
    ...new Set(
      (slugsParam ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ];

  const orgs = slugs
    .map((slug) => getOrgBySlug(slug))
    .filter((o): o is Org => Boolean(o));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 pb-28 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
          <path
            d="M12 15l-5-5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        All clubs
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Compare
      </h1>

      {orgs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-foreground/50">
          Nothing to compare yet. Use the{" "}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="inline size-4 align-text-bottom"
            fill="none"
          >
            <path
              d="M4 7h7M4 12h16M4 17h7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>{" "}
          icon on a club card to add it, then come back here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-160 table-fixed border-collapse">
            <thead>
              <tr className="divide-x divide-border border-b border-border">
                <th className="sticky left-0 z-10 w-28 bg-background py-3 pl-4 pr-3 sm:w-36" />
                {orgs.map((org) => (
                  <th
                    key={org.slug}
                    scope="col"
                    className="px-4 py-3 text-left align-top"
                  >
                    <Link
                      href={`/clubs/${org.slug}`}
                      className="font-medium hover:text-accent"
                    >
                      {org.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row
                label="Status"
                cells={orgs.map((org) => (
                  <StatusBadge key={org.slug} cycle={getLatestCycle(org)} />
                ))}
              />
              <Row
                label="Category"
                cells={orgs.map((org) => CATEGORY_LABEL[org.category])}
              />
              <Row
                label="Disciplines"
                cells={orgs.map((org) => org.disciplines.join(", "))}
              />
              <Row
                label="Opens"
                cells={orgs.map(
                  (org) => formatDate(getLatestCycle(org).opensAt) ?? "—"
                )}
              />
              <Row
                label="Closes"
                cells={orgs.map(
                  (org) => formatDate(getLatestCycle(org).closesAt) ?? "—"
                )}
              />
              <Row
                label="Tags"
                cells={orgs.map((org) => org.tags.join(", ") || "—")}
              />
              <Row
                label="Links"
                cells={orgs.map((org) => {
                  const links = [
                    { label: "Website", href: org.links.website },
                    { label: "Instagram", href: org.links.instagram },
                    { label: "Discord", href: org.links.discord },
                  ].filter(
                    (l): l is { label: LinkLabel; href: string } =>
                      Boolean(l.href)
                  );
                  return (
                    <div key={org.slug} className="flex items-center gap-2">
                      {links.length === 0 && "—"}
                      {links.map((l) => (
                        <a
                          key={l.label}
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${org.name} on ${l.label}`}
                          className="text-foreground/50 hover:text-accent"
                        >
                          <LinkIcon label={l.label} />
                        </a>
                      ))}
                    </div>
                  );
                })}
              />
              <Row
                label="Apply"
                cells={orgs.map((org) => {
                  const url = getLatestCycle(org).applyUrl;
                  return url ? (
                    <a
                      key={org.slug}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
                    >
                      Apply now
                    </a>
                  ) : (
                    "—"
                  );
                })}
              />
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
