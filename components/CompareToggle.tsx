"use client";

import {
  getCompareServerSnapshot,
  getCompareSnapshot,
  subscribeCompare,
  toggleCompare,
} from "@/lib/compareStore";
import { toggleButtonClassName, useToggleButton } from "@/components/useToggleButton";

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
  const { active, handleClick } = useToggleButton(
    subscribeCompare,
    getCompareSnapshot,
    getCompareServerSnapshot,
    (compare) => compare.includes(slug),
    toggleCompare,
    slug,
    coverLink
  );

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active ? `Remove ${name} from compare` : `Add ${name} to compare`
      }
      title={active ? "Remove from compare" : "Add to compare"}
      onClick={handleClick}
      className={toggleButtonClassName(active)}
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
