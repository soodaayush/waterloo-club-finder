// An ordered, capped list of club slugs the visitor has picked to compare
// side by side. Lives in sessionStorage - a working set for one visit, not a
// permanent list like lib/savedStore.ts. Read via useSyncExternalStore from
// any client component - see components/CompareToggle.tsx and CompareBar.tsx.

const COMPARE_KEY = "clubFinderCompare";
export const MAX_COMPARE = 4;

const EMPTY: readonly string[] = [];
let cached: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = sessionStorage.getItem(COMPARE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  try {
    sessionStorage.setItem(COMPARE_KEY, JSON.stringify(slugs));
  } catch {
    // sessionStorage unavailable (e.g. private browsing) - ignore
  }
}

export function getCompareSnapshot(): readonly string[] {
  if (!cached) cached = read();
  return cached;
}

export function getCompareServerSnapshot(): readonly string[] {
  return EMPTY;
}

export function subscribeCompare(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function set(next: string[]) {
  cached = next;
  write(next);
  for (const listener of listeners) listener();
}

/** Toggles a slug in the compare set. Adding past MAX_COMPARE drops the oldest pick. */
export function toggleCompare(slug: string) {
  const current = getCompareSnapshot();
  if (current.includes(slug)) {
    set(current.filter((s) => s !== slug));
  } else {
    set([...current, slug].slice(-MAX_COMPARE));
  }
}

export function clearCompare() {
  set([]);
}
