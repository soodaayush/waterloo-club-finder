import type { Cycle } from "@/data/schema";
import { daysUntil } from "@/lib/date";

const STYLES: Record<Cycle["status"], string> = {
  Open: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Rolling: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Upcoming:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const DOT_STYLES: Record<Cycle["status"], string> = {
  Open: "bg-green-500",
  Rolling: "bg-blue-500",
  Upcoming: "bg-amber-500",
  Closed: "bg-gray-400",
};

export function StatusBadge({ cycle }: { cycle: Cycle }) {
  let label: string = cycle.status;

  if (cycle.status === "Open" && cycle.closesAt) {
    const days = daysUntil(cycle.closesAt);
    if (days !== null && days >= 0) {
      label = `Open · ${days === 0 ? "closes today" : `${days}d left`}`;
    }
  } else if (cycle.status === "Upcoming" && cycle.opensAt) {
    const days = daysUntil(cycle.opensAt);
    if (days !== null && days >= 0) {
      label = `Opens in ${days}d`;
    }
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STYLES[cycle.status]}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${DOT_STYLES[cycle.status]}`}
      />
      {label}
    </span>
  );
}
