// A small set of saved club slugs, persisted to localStorage so it survives
// across visits (unlike the sessionStorage-backed filters). Read via
// useSyncExternalStore from any client component - see components/SaveButton.tsx.
import { createToggleStore } from "@/lib/createToggleStore";

const EMPTY: ReadonlySet<string> = new Set();

const store = createToggleStore<ReadonlySet<string>>({
  storageKey: "clubFinderSaved",
  storage: () => localStorage,
  empty: EMPTY,
  serialize: (saved) => JSON.stringify([...saved]),
  deserialize: (raw) => new Set(JSON.parse(raw)),
  toggle: (current, slug) => {
    const next = new Set(current);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    return next;
  },
});

export const getSavedSnapshot = store.getSnapshot;
export const getSavedServerSnapshot = store.getServerSnapshot;
export const subscribeSaved = store.subscribe;
export const toggleSaved = store.toggle;
