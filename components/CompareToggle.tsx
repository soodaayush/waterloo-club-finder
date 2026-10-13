"use client";

import { useSyncExternalStore } from "react";
import {
  getCompareServerSnapshot,
  getCompareSnapshot,
  subscribeCompare,
  toggleCompare,
} from "@/lib/compareStore";

/** Adds/removes a club from the compare set. See components/CompareBar.tsx. */
export function CompareToggle({
  slug,
  name,
  coverLink = false,
}: {
  slug: string;
  name: string;
  coverLink?: boolean;
}) {
  const compare = useSyncExternalStore(
    subscribeCompare,
    getCompareSnapshot,
    getCompareServerSnapshot
  );
  const active = compare.includes(slug);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active ? `Remove ${name} from compare` : `Add ${name} to compare`
      }
      title={active ? "Remove from compare" : "Add to compare"}
      onClick={(e) => {
        if (coverLink) {
          e.preventDefault();
          e.stopPropagation();
        }
        toggleCompare(slug);
      }}
      className={`relative z-10 rounded-full p-1.5 transition hover:bg-foreground/5 ${
        active ? "text-accent" : "text-foreground/40 hover:text-accent"
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
      >
        {active ? (
          <path
            d="M5 12.5 9.5 17 19 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M4 7h7M4 12h16M4 17h7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
