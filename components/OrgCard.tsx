import Link from "next/link";
import type { Org } from "@/data/schema";
import { CATEGORY_LABEL, getLatestCycle } from "@/lib/orgUtils";
import { formatDate, isStale } from "@/lib/date";
import { StatusBadge } from "@/components/StatusBadge";
import { LinkIcon, type LinkLabel } from "@/components/LinkIcon";

export function OrgCard({ org }: { org: Org }) {
  const cycle = getLatestCycle(org);
  const stale = isStale(cycle.lastVerified);
  const links = [
    { label: "Website", href: org.links.website },
    { label: "Instagram", href: org.links.instagram },
    { label: "Discord", href: org.links.discord },
  ].filter((l): l is { label: LinkLabel; href: string } => Boolean(l.href));

  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md sm:p-5">
      <Link
        href={`/clubs/${org.slug}`}
        className="absolute inset-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="sr-only">{org.name}</span>
      </Link>

      <div className="flex flex-col items-start gap-2">
        <h3 className="text-pretty font-medium group-hover:text-accent">
          {org.name}
        </h3>
        <StatusBadge cycle={cycle} />
      </div>
      <p className="line-clamp-2 text-sm text-foreground/60">
        {org.description}
      </p>
      {stale && (
        <p className="text-xs text-amber-700 dark:text-amber-500">
          ⚠ Unverified since {formatDate(cycle.lastVerified)}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground/50">
          {CATEGORY_LABEL[org.category]}
        </span>
        {org.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/50"
          >
            {tag}
          </span>
        ))}
        {links.length > 0 && (
          <div className="relative z-10 ml-auto flex items-center gap-0.5">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${org.name} on ${l.label}`}
                className="rounded-md p-1 text-foreground/40 transition hover:bg-foreground/5 hover:text-accent"
              >
                <LinkIcon label={l.label} />
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
