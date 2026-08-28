import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-4 px-4 py-20 sm:px-6">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        We couldn&apos;t find that page
      </h1>
      <p className="text-foreground/60">
        The club or page you&apos;re looking for doesn&apos;t exist, or its
        link has changed.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground"
      >
        Browse all clubs
      </Link>
    </main>
  );
}
