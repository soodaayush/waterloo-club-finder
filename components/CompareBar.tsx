"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  clearCompare,
  getCompareServerSnapshot,
  getCompareSnapshot,
  subscribeCompare,
  toggleCompare,
} from "@/lib/compareStore";

/** Fixed bottom bar showing the clubs picked for comparison. Mounted once in
 *  app/layout.tsx so a selection made on one page survives to the next. */
export function CompareBar({
  orgNames,
}: {
  orgNames: Record<string, string>;
}) {
  const compare = useSyncExternalStore(
    subscribeCompare,
    getCompareSnapshot,
    getCompareServerSnapshot
  );

  if (compare.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <span className="text-sm font-medium text-foreground/70">
          Comparing {compare.length}:
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {compare.map((slug) => (
            <span
              key={slug}
              className="inline-flex items-center gap-1 rounded-full bg-foreground/6 py-1 pl-2.5 pr-1 text-xs font-medium"
            >
              {orgNames[slug] ?? slug}
              <button
                type="button"
                aria-label={`Remove ${orgNames[slug] ?? slug} from compare`}
                onClick={() => toggleCompare(slug)}
                className="rounded-full p-0.5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-3"
                  fill="none"
                >
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={clearCompare}
          className="text-sm font-medium text-foreground/60 underline underline-offset-2 hover:text-foreground"
        >
          Clear
        </button>
        <Link
          href={`/compare?slugs=${compare.join(",")}`}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Compare
        </Link>
      </div>
    </div>
  );
}
