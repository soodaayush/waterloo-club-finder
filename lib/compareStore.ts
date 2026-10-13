// An ordered, capped list of club slugs the visitor has picked to compare
// side by side. Lives in sessionStorage - a working set for one visit, not a
// permanent list like lib/savedStore.ts. Read via useSyncExternalStore from
// any client component - see components/CompareToggle.tsx and CompareBar.tsx.
import { createToggleStore } from "@/lib/createToggleStore";

export const MAX_COMPARE = 4;
const EMPTY: readonly string[] = [];

const store = createToggleStore<readonly string[]>({
  storageKey: "clubFinderCompare",
  storage: () => sessionStorage,
  empty: EMPTY,
  serialize: (slugs) => JSON.stringify(slugs),
  deserialize: (raw) => JSON.parse(raw),
  // Adding past MAX_COMPARE drops the oldest pick.
  toggle: (current, slug) =>
    current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug].slice(-MAX_COMPARE),
});

export const getCompareSnapshot = store.getSnapshot;
export const getCompareServerSnapshot = store.getServerSnapshot;
export const subscribeCompare = store.subscribe;
export const toggleCompare = store.toggle;
export const clearCompare = store.clear;
