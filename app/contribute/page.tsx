import Link from "next/link";
import { GITHUB_REPO, getNewOrgUrl } from "@/lib/github";

export const metadata = {
  title: "Contribute",
};

export default function ContributePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="size-4"
        >
          <path
            d="M12 15l-5-5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        All clubs
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How this site stays accurate
        </h1>
        <p className="text-foreground/60">
          There&apos;s no admin team manually running this. The data behind
          every club page lives as plain JSON files in{" "}
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            this project&apos;s GitHub repo
          </a>
          . Updates happen through pull requests, which anyone can open. You
          don&apos;t need git experience; GitHub&apos;s web editor handles the
          fork-and-PR steps for you.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="font-medium">Update an existing club or deadline</h2>
        <ol className="flex flex-col gap-3">
          {[
            <>
              Open the club&apos;s page and click{" "}
              <strong>&quot;Edit on GitHub&quot;</strong>.
            </>,
            "Sign in to GitHub (free account) if prompted. It forks the repo for you automatically.",
            <>
              Edit the JSON: fill in <code>opensAt</code>,{" "}
              <code>closesAt</code>, <code>applyUrl</code>, and{" "}
              <code>lastVerified</code>. The badge flips between{" "}
              <em>Upcoming</em>, <em>Open</em>, and <em>Closed</em> on its own
              as those dates pass, so <code>status</code> only needs setting
              for <em>Rolling</em> or when there are no dates yet.
            </>,
            "Commit the change as a new pull request.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5 text-foreground/70">{step}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-foreground/60">
          The status tracks <strong>joining as a general member</strong>,
          which is the question a student browsing this site is asking. Exec,
          lead, or volunteer hiring belongs in <code>notes</code>, not{" "}
          <code>status</code>. A club whose leadership applications open still
          shows whatever its general membership is.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="font-medium">Add a new club or design team</h2>
        <p className="text-sm text-foreground/60">
          Click the button below to start a new file pre-filled with the
          expected format, rename it to your club&apos;s slug, fill in the
          details, and open a pull request.
        </p>
        <a
          href={getNewOrgUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground"
        >
          Add a new club on GitHub ↗
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      </section>
    </main>
  );
}
