"use client";

import { useState, useSyncExternalStore } from "react";
import { shareOrCopy, webShareStore } from "@/lib/share";

/** Native share-sheet button for a club's own page, falling back to copying
 *  the URL where Web Share isn't available (desktop Firefox, mainly). */
export function ShareButton({ title }: { title: string }) {
  const canShare = useSyncExternalStore(
    webShareStore.subscribe,
    webShareStore.getSnapshot,
    webShareStore.getServerSnapshot
  );
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const result = await shareOrCopy({ title, url: window.location.href });
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={canShare ? `Share ${title}` : `Copy link to ${title}`}
      title={copied ? "Link copied!" : canShare ? "Share" : "Copy link"}
      className="relative z-10 rounded-full p-1.5 text-foreground/40 transition hover:bg-foreground/5 hover:text-accent"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
      >
        <path
          d="M12 15V3M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
