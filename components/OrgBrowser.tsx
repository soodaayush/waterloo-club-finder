"use client";

import { useId, useMemo, useSyncExternalStore } from "react";
import type { Category, Discipline, Org, Status } from "@/data/schema";
import { OrgCard } from "@/components/OrgCard";
import {
  CATEGORY_LABEL,
  DISCIPLINES,
  STATUS_LABEL,
  effectiveStatus,
  getLatestCycle,
  sortByUrgency,
} from "@/lib/orgUtils";

const CATEGORY_ORDER: Category[] = ["DesignTeam", "Club", "CaseComp", "Other"];
const STATUSES: Status[] = ["Open", "Upcoming", "Rolling", "Closed"];

const FILTERS_STORAGE_KEY = "clubFinderFilters";

type StoredFilters = {
  query: string;
  discipline: Discipline | null;
  category: Category | null;
  status: Status | null;
  showClosed: boolean;
};

const DEFAULT_FILTERS: StoredFilters = {
  query: "",
  discipline: null,
  category: null,
  status: null,
  showClosed: false,
};

// Filters live in a module-level store backed by sessionStorage, read via
// useSyncExternalStore, so they survive navigating to a club page and back
// (which unmounts and remounts this component) without an effect-driven
// setState, and without touching sessionStorage during server rendering.
let cachedFilters: StoredFilters | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): StoredFilters {
  if (cachedFilters) return cachedFilters;

  let filters: StoredFilters;
  try {
    const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    filters = raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : DEFAULT_FILTERS;
  } catch {
    filters = DEFAULT_FILTERS;
  }
  cachedFilters = filters;
  return filters;
}

function getServerSnapshot(): StoredFilters {
  return DEFAULT_FILTERS;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setFilters(patch: Partial<StoredFilters>) {
  cachedFilters = { ...getSnapshot(), ...patch };
  try {
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(cachedFilters));
  } catch {
    // sessionStorage unavailable (e.g. private browsing) - ignore
  }
  for (const listener of listeners) listener();
}

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
  const categories = CATEGORY_ORDER.filter((c) =>
    orgs.some((o) => o.category === c)
  );
  const { query, discipline, category, status, showClosed } =
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const { filtered, hiddenClosed } = useMemo(() => {
    const q = query.trim().toLowerCase();
    let hiddenClosed = 0;

    const results = orgs.filter((org) => {
      if (discipline && !org.disciplines.includes(discipline)) return false;
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
  }, [orgs, query, discipline, category, status, showClosed]);

  const hasActiveFilters = Boolean(query || discipline || category || status);

  function clearFilters() {
    setFilters({ query: "", discipline: null, category: null, status: null });
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
              onChange={(e) => setFilters({ query: e.target.value })}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus-visible:border-accent"
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-0.5 text-xs font-medium text-foreground/50">
            Discipline
          </legend>
          <div className="flex flex-wrap gap-2">
            {DISCIPLINES.map((d) => (
              <Chip
                key={d}
                value={d}
                label={d}
                active={discipline === d}
                onClick={(v) =>
                  setFilters({ discipline: discipline === v ? null : v })
                }
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-0.5 text-xs font-medium text-foreground/50">
            Category
          </legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip
                key={c}
                value={c}
                label={CATEGORY_LABEL[c]}
                active={category === c}
                onClick={(v) =>
                  setFilters({ category: category === v ? null : v })
                }
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
                onClick={(v) => setFilters({ status: status === v ? null : v })}
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
                onChange={(e) => setFilters({ showClosed: e.target.checked })}
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

      <details className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground/60 [&_summary]:cursor-pointer">
        <summary className="font-medium text-foreground/70 select-none">
          What do the status labels mean?
        </summary>
        <ul className="mt-3 flex flex-col gap-2">
          {[
            ["bg-green-500", "Open", "Applications are open now. A countdown shows when they close."],
            ["bg-amber-500", "Upcoming", "Applications open on a set date."],
            ["bg-blue-500", "Open to join", "No application. Show up to a meeting or join the Discord."],
            ["bg-blue-500", "Apply anytime", "There's an application form, but no deadline."],
            ["bg-gray-400", "Closed", "The application window has passed."],
          ].map(([dot, name, desc]) => (
            <li key={name} className="flex items-start gap-2.5">
              <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dot}`} />
              <span>
                <span className="font-medium text-foreground/80">{name}</span>
                {": "}
                {desc}
              </span>
            </li>
          ))}
        </ul>
      </details>

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
