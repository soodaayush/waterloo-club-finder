// A small set of saved club slugs, persisted to localStorage so it survives
// across visits (unlike the sessionStorage-backed filters). Read via
// useSyncExternalStore from any client component - see components/SaveButton.tsx.

const SAVED_KEY = "clubFinderSaved";

const EMPTY: ReadonlySet<string> = new Set();
let cached: Set<string> | null = null;
const listeners = new Set<() => void>();

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function write(slugs: Set<string>) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...slugs]));
  } catch {
    // localStorage unavailable (e.g. private browsing) - ignore
  }
}

export function getSavedSnapshot(): ReadonlySet<string> {
  if (!cached) cached = read();
  return cached;
}

export function getSavedServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

export function subscribeSaved(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function toggleSaved(slug: string) {
  const next = new Set(getSavedSnapshot());
  if (next.has(slug)) {
    next.delete(slug);
  } else {
    next.add(slug);
  }
  cached = next;
  write(next);
  for (const listener of listeners) listener();
}
