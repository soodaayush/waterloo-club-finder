"use client";

import {
  getSavedServerSnapshot,
  getSavedSnapshot,
  subscribeSaved,
  toggleSaved,
} from "@/lib/savedStore";
import { toggleButtonClassName, useToggleButton } from "@/components/useToggleButton";

/** Bookmark toggle. Works standalone, and sits on top of OrgCard's full-card
 *  link overlay when `coverLink` is set. */
export function SaveButton({
  slug,
  name,
  coverLink = false,
}: {
  slug: string;
  name: string;
  coverLink?: boolean;
}) {
  const { active: isSaved, handleClick } = useToggleButton(
    subscribeSaved,
    getSavedSnapshot,
    getSavedServerSnapshot,
    (saved) => saved.has(slug),
    toggleSaved,
    slug,
    coverLink
  );

  return (
    <button
      type="button"
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${name} from saved clubs` : `Save ${name}`}
      title={isSaved ? "Remove from saved" : "Save for later"}
      onClick={handleClick}
      className={toggleButtonClassName(isSaved)}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill={isSaved ? "currentColor" : "none"}
      >
        <path
          d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
