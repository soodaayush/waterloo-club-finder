// Web Share API helper, shared by components/ShareButton.tsx (club pages)
// and the "Copy link"/"Share" action in components/OrgBrowser.tsx (filtered
// homepage views). Browser-only - only call from a client component, after
// mount (see canUseWebShare's usage note below).

/** True if the Web Share API is available in this browser. */
export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

// Whether Web Share exists never changes over a page's lifetime, so there's
// nothing to subscribe to - this is read via useSyncExternalStore purely to
// get its server/client snapshot split for free: `navigator` doesn't exist
// during server rendering, so branching render output on it directly would
// be a hydration mismatch. getServerSnapshot below always returns false
// (matching the server, which has no Web Share either way), and getSnapshot
// gives the real answer once running in the browser.
function noopSubscribe(): () => void {
  return () => {};
}

export function getWebShareSnapshot(): boolean {
  return canUseWebShare();
}

export function getWebShareServerSnapshot(): boolean {
  return false;
}

export const webShareStore = {
  subscribe: noopSubscribe,
  getSnapshot: getWebShareSnapshot,
  getServerSnapshot: getWebShareServerSnapshot,
};

/**
 * Shares via the native share sheet where available, falling back to
 * copying the URL to the clipboard. Returns what actually happened so the
 * caller can show the right feedback ("Link copied!" only makes sense for
 * the copy path - a share sheet is its own confirmation).
 */
export async function shareOrCopy(data: {
  title: string;
  url: string;
}): Promise<"shared" | "copied" | "failed"> {
  if (canUseWebShare()) {
    try {
      await navigator.share(data);
      return "shared";
    } catch {
      // User cancelled the share sheet, or it failed - don't also try to
      // copy, that'd be a surprising second action after dismissing one.
      return "failed";
    }
  }

  try {
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    // Clipboard unavailable (e.g. private browsing) - the URL is already
    // in the address bar as a last resort.
    return "failed";
  }
}
