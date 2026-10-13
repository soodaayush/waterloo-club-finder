// Shared shape behind lib/savedStore.ts (a Set, localStorage, permanent) and
// lib/compareStore.ts (a capped array, sessionStorage, one-visit working
// set): read/write a value to Web Storage, cache it in memory, and notify
// subscribers on change - read via useSyncExternalStore from any client
// component. The two stores differ in container type and storage backend,
// both of which are just parameters here.

type WebStorage = Pick<Storage, "getItem" | "setItem">;

export function createToggleStore<T>(options: {
  storageKey: string;
  storage: () => WebStorage;
  empty: T;
  serialize: (value: T) => string;
  deserialize: (raw: string) => T;
  toggle: (current: T, slug: string) => T;
}) {
  let cached: T | null = null;
  const listeners = new Set<() => void>();

  function read(): T {
    try {
      const raw = options.storage().getItem(options.storageKey);
      return raw ? options.deserialize(raw) : options.empty;
    } catch {
      return options.empty;
    }
  }

  function write(value: T) {
    try {
      options.storage().setItem(options.storageKey, options.serialize(value));
    } catch {
      // storage unavailable (e.g. private browsing) - ignore
    }
  }

  function getSnapshot(): T {
    if (cached === null) cached = read();
    return cached;
  }

  function set(next: T) {
    cached = next;
    write(next);
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot,
    getServerSnapshot(): T {
      return options.empty;
    },
    subscribe(callback: () => void): () => void {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    toggle(slug: string) {
      set(options.toggle(getSnapshot(), slug));
    },
    clear() {
      set(options.empty);
    },
  };
}
