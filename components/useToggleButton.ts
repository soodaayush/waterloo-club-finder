"use client";

import { useSyncExternalStore, type MouseEvent } from "react";

// Shared shape behind components/SaveButton.tsx and CompareToggle.tsx: both
// read a store via useSyncExternalStore, derive an `active` boolean from it,
// and on click optionally swallow the click (when sitting on top of a
// card's full-card link overlay) before toggling. Each component still owns
// its own icon/label text - the only genuinely different parts.
export function useToggleButton<T>(
  subscribe: (callback: () => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot: () => T,
  isActive: (state: T) => boolean,
  toggle: (slug: string) => void,
  slug: string,
  coverLink: boolean
) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const active = isActive(state);

  function handleClick(e: MouseEvent) {
    if (coverLink) {
      e.preventDefault();
      e.stopPropagation();
    }
    toggle(slug);
  }

  return { active, handleClick };
}

/** The pill-icon-button shell shared by SaveButton and CompareToggle. */
export function toggleButtonClassName(active: boolean): string {
  return `relative z-10 rounded-full p-1.5 transition hover:bg-foreground/5 ${
    active ? "text-accent" : "text-foreground/40 hover:text-accent"
  }`;
}
