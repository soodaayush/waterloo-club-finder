import Link from "next/link";
import type { Org } from "@/data/schema";
import { getLatestCycle } from "@/lib/orgUtils";
import { StatusBadge } from "@/components/StatusBadge";

export function OrgCard({ org }: { org: Org }) {
  const cycle = getLatestCycle(org);

  return (
    <Link
      href={`/clubs/${org.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium group-hover:text-accent">{org.name}</h3>
        <StatusBadge cycle={cycle} />
      </div>
      <p className="line-clamp-2 text-sm text-foreground/60">
        {org.description}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground/50">
          {org.category}
        </span>
        {org.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/50"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
