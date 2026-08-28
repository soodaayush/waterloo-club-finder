import Link from "next/link";
import { getAllOrgs } from "@/lib/getOrgs";
import { effectiveStatus, getLatestCycle } from "@/lib/orgUtils";
import { OrgBrowser } from "@/components/OrgBrowser";

// Re-generate periodically so date-derived statuses and "Nd left" countdowns
// stay current without a rebuild. See lib/orgUtils.ts#effectiveStatus.
export const revalidate = 3600;

export default function HomePage() {
  const orgs = getAllOrgs();
  const openCount = orgs.filter(
    (org) => effectiveStatus(getLatestCycle(org)) === "Open"
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-4">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Find your club or design team,{" "}
          <span className="text-accent">before the deadline passes</span>.
        </h1>
        <p className="max-w-2xl text-balance text-base text-foreground/60">
          One place to check application status across UWaterloo clubs and
          design teams — instead of Instagram, Discord, and a dozen
          websites. Data is community-maintained on GitHub; see something
          stale?{" "}
          <Link
            href="/contribute"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Help fix it.
          </Link>
        </p>

        <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-2 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-foreground/50">Tracking</dt>
            <dd className="font-semibold">{orgs.length} orgs</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-foreground/50">Open right now</dt>
            <dd className="font-semibold text-green-600 dark:text-green-400">
              {openCount}
            </dd>
          </div>
        </dl>
      </header>

      <OrgBrowser orgs={orgs} />
    </main>
  );
}
