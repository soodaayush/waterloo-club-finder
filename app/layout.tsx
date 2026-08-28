import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Track application status for UWaterloo clubs and design teams in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: SITE_NAME,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md font-semibold tracking-tight"
            >
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-lg bg-accent text-sm text-accent-foreground"
              >
                W
              </span>
              <span className="text-sm sm:text-base">Waterloo Club Finder</span>
            </Link>
            <Link
              href="/contribute"
              className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground/80 transition hover:border-accent hover:text-foreground"
            >
              Contribute
            </Link>
          </div>
        </header>

        <div id="main-content" className="flex flex-1 flex-col">
          {children}
        </div>

        <footer className="border-t border-border">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-1.5 px-4 py-6 text-xs text-foreground/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>
              Not an official University of Waterloo site. Data is
              community-maintained.{" "}
              <Link href="/contribute" className="underline underline-offset-2">
                See something wrong?
              </Link>
            </span>
            <span>
              Made by{" "}
              <a
                href="https://www.aayushsood.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Aayush Sood
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
