import Link from "next/link";
import { getAllOrgs } from "@/lib/getOrgs";
import {
  closingSoon,
  getLatestCycle,
  openWithDeadlineCount,
} from "@/lib/orgUtils";
import { newOrgSlugs } from "@/lib/newness";
import { OrgBrowser } from "@/components/OrgBrowser";
import { StatusBadge } from "@/components/StatusBadge";

// Re-generate periodically so date-derived statuses and "Nd left" countdowns
// stay current without a rebuild. See lib/orgUtils.ts#effectiveStatus.
export const revalidate = 3600;

export default function HomePage() {
  const orgs = getAllOrgs();
  const openCount = openWithDeadlineCount(orgs);
  const soon = closingSoon(orgs);
  // Computed server-side (shells out to git) and passed down as plain data -
  // see the comment on OrgCard for why this can't live in the client tree.
  const newSlugs = newOrgSlugs(orgs);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 pb-28 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-4">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Find your club or design team,{" "}
          <span className="text-accent">before the deadline passes</span>.
        </h1>
        <p className="max-w-2xl text-balance text-base text-foreground/60">
          One place to check application status across UWaterloo clubs and
          design teams, instead of Instagram, Discord, and a dozen
          websites. Data is community-maintained on GitHub. See something
          stale?{" "}
          <Link
            href="/contribute"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Help fix it.
          </Link>{" "}
          Not sure where to start?{" "}
          <Link
            href="/quiz"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Take the quiz.
          </Link>
        </p>

        <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-2 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-foreground/50">Tracking</dt>
            <dd className="font-semibold">{orgs.length} orgs</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-foreground/50">Open with a deadline</dt>
            <dd className="font-semibold text-green-600 dark:text-green-400">
              {openCount}
            </dd>
          </div>
        </dl>
      </header>

      {soon.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground/70">
              Closing soon
            </h2>
            <a
              href="/calendar.ics"
              className="text-xs font-medium text-foreground/50 underline underline-offset-2 hover:text-foreground"
            >
              Subscribe to all deadlines ↓
            </a>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {soon.map((org) => (
              <Link
                key={org.slug}
                href={`/clubs/${org.slug}`}
                className="flex w-56 shrink-0 flex-col gap-2 rounded-xl border border-border bg-surface p-3.5 transition hover:border-accent/60"
              >
                <span className="line-clamp-1 font-medium">{org.name}</span>
                <StatusBadge cycle={getLatestCycle(org)} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <OrgBrowser orgs={orgs} newSlugs={newSlugs} />
    </main>
  );
}
