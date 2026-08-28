import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllOrgs, getOrgBySlug } from "@/lib/getOrgs";
import { getEditOrgUrl } from "@/lib/github";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, isStale } from "@/lib/date";
import { effectiveStatus, getLatestCycle } from "@/lib/orgUtils";

export function generateStaticParams() {
  return getAllOrgs().map((org) => ({ slug: org.slug }));
}

// Re-generate periodically so date-derived statuses and "Nd left" countdowns
// stay current without a rebuild. See lib/orgUtils.ts#effectiveStatus.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = getOrgBySlug(slug);
  if (!org) return {};

  const cycle = getLatestCycle(org);
  const status = effectiveStatus(cycle);
  const title = `${org.name} — applications ${status}`;

  return {
    title,
    description: org.description,
    openGraph: {
      title,
      description: org.description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description: org.description,
    },
  };
}

const LINK_ICONS: Record<string, string> = {
  Website: "M13.5 6.5l4 4-4 4M4 12h13",
  Instagram:
    "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm4.5-.5h.01",
  Discord:
    "M8 9h.01M16 9h.01M8.5 16.5c2 1 5 1 7 0M6 6l-2 12 4 2 1.5-2.5M18 6l2 12-4 2-1.5-2.5",
};

export default async function ClubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = getOrgBySlug(slug);
  if (!org) notFound();

  const cycles = [...org.cycles].reverse();
  const links = [
    { label: "Website", href: org.links.website },
    { label: "Instagram", href: org.links.instagram },
    { label: "Discord", href: org.links.discord },
  ].filter((l) => l.href);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 pb-28 sm:px-6 sm:py-14 sm:pb-14">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="size-4"
        >
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

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {org.name}
          </h1>
          <StatusBadge cycle={cycles[0]} />
        </div>
        <p className="text-foreground/60">{org.description}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground/50">
            {org.category}
          </span>
          {org.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs text-foreground/50"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-4"
              >
                <path
                  d={LINK_ICONS[l.label]}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {l.label}
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Application cycles</h2>
        <ul className="flex flex-col gap-3">
          {cycles.map((cycle, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{cycle.term}</span>
                <StatusBadge cycle={cycle} />
              </div>
              <div className="text-sm text-foreground/60">
                {cycle.opensAt && <div>Opens: {formatDate(cycle.opensAt)}</div>}
                {cycle.closesAt && (
                  <div>Closes: {formatDate(cycle.closesAt)}</div>
                )}
                {cycle.notes && <p className="mt-1">{cycle.notes}</p>}
              </div>
              {cycle.applyUrl && (
                <a
                  href={cycle.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                >
                  Apply now
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              )}
              <div
                className={`mt-1 text-xs ${
                  isStale(cycle.lastVerified)
                    ? "text-amber-700 dark:text-amber-500"
                    : "text-foreground/40"
                }`}
              >
                {isStale(cycle.lastVerified) && "⚠ "}
                Last verified {formatDate(cycle.lastVerified)} · source:{" "}
                {cycle.source}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-dashed border-border p-4 text-sm sm:p-5">
        <p className="text-foreground/60">
          Know a deadline that&apos;s changed, or spot something wrong here?
          This page is backed by a JSON file in our GitHub repo — edits go
          through a pull request, no login beyond a free GitHub account
          needed.
        </p>
        <a
          href={getEditOrgUrl(org.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit rounded-full border border-border px-3.5 py-2 font-medium transition hover:border-accent hover:text-accent"
        >
          Edit on GitHub ↗<span className="sr-only"> (opens in new tab)</span>
        </a>
      </section>

      {/* Mobile-only sticky quick action, mirrors the primary CTA above the fold on small screens */}
      {cycles[0].applyUrl && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 p-4 backdrop-blur-md sm:hidden">
          <a
            href={cycles[0].applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1 rounded-full bg-accent px-4 py-3 text-sm font-medium text-accent-foreground"
          >
            Apply now
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </div>
      )}
    </main>
  );
}
