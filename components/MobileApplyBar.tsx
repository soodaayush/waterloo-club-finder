"use client";

import { useSyncExternalStore } from "react";
import {
  getCompareServerSnapshot,
  getCompareSnapshot,
  subscribeCompare,
} from "@/lib/compareStore";

/**
 * Mobile-only sticky "Apply now" CTA, mirrors the primary CTA above the fold
 * on small screens. Hidden while CompareBar is showing (same fixed-bottom
 * region, both inset-x-0 bottom-0) so the two never overlap - the in-page
 * "Apply now" button higher up the cycle list is still reachable either way.
 */
export function MobileApplyBar({ applyUrl }: { applyUrl: string }) {
  const compare = useSyncExternalStore(
    subscribeCompare,
    getCompareSnapshot,
    getCompareServerSnapshot
  );
  if (compare.length > 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 p-4 backdrop-blur-md sm:hidden">
      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-1 rounded-full bg-accent px-4 py-3 text-sm font-medium text-accent-foreground"
      >
        Apply now
        <span className="sr-only"> (opens in new tab)</span>
      </a>
    </div>
  );
}
