"use client";

import { useId, useMemo, useState } from "react";
import type { Category, Org, Status } from "@/data/schema";
import { OrgCard } from "@/components/OrgCard";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  effectiveStatus,
  getLatestCycle,
  sortByUrgency,
} from "@/lib/orgUtils";

const CATEGORIES: Category[] = ["DesignTeam", "Club", "CaseComp", "Other"];
const STATUSES: Status[] = ["Open", "Upcoming", "Rolling", "Closed"];

function Chip<T extends string>({
  value,
  label,
  active,
  onClick,
}: {
  value: T;
  label: string;
  active: boolean;
  onClick: (value: T) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onClick(value)}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition sm:py-1.5 ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border text-foreground/60 hover:border-accent/60 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function OrgBrowser({ orgs }: { orgs: Org[] }) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const { filtered, hiddenClosed } = useMemo(() => {
    const q = query.trim().toLowerCase();
    let hiddenClosed = 0;

    const results = orgs.filter((org) => {
      if (category && org.category !== category) return false;

      const matchesText =
        !q ||
        org.name.toLowerCase().includes(q) ||
        org.description.toLowerCase().includes(q) ||
        org.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchesText) return false;

      const orgStatus = effectiveStatus(getLatestCycle(org));
      if (status) return orgStatus === status;
      if (!showClosed && orgStatus === "Closed") {
        hiddenClosed++;
        return false;
      }
      return true;
    });

    return { filtered: sortByUrgency(results), hiddenClosed };
  }, [orgs, query, category, status, showClosed]);

  const hasActiveFilters = Boolean(query || category || status);

  function clearFilters() {
    setQuery("");
    setCategory(null);
    setStatus(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div>
          <label htmlFor={searchId} className="sr-only">
            Search clubs and design teams
          </label>
          <div className="relative">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/40"
            >
              <path
                d="M9 16A7 7 0 1 0 9 2a7 7 0 0 0 0 14ZM18 18l-3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              id={searchId}
              type="search"
              placeholder="Search clubs and design teams…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus-visible:border-accent"
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-0.5 text-xs font-medium text-foreground/50">
            Category
          </legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                value={c}
                label={CATEGORY_LABEL[c]}
                active={category === c}
                onClick={(v) => setCategory(category === v ? null : v)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-0.5 text-xs font-medium text-foreground/50">
            Status
          </legend>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Chip
                key={s}
                value={s}
                label={STATUS_LABEL[s]}
                active={status === s}
                onClick={(v) => setStatus(status === v ? null : v)}
              />
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex items-center justify-between text-sm text-foreground/50">
        <span aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </span>
        <div className="flex items-center gap-4">
          {!status && (hiddenClosed > 0 || showClosed) && (
            <label className="flex cursor-pointer items-center gap-1.5 select-none">
              <input
                type="checkbox"
                checked={showClosed}
                onChange={(e) => setShowClosed(e.target.checked)}
                className="accent-accent"
              />
              Show closed{hiddenClosed > 0 && ` (${hiddenClosed})`}
            </label>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-foreground/70 underline underline-offset-2 hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-foreground/50">
          No clubs match your filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((org) => (
            <OrgCard key={org.slug} org={org} />
          ))}
        </div>
      )}
    </div>
  );
}
