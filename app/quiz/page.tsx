"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category, Discipline } from "@/data/schema";

const DISCIPLINE_OPTIONS: { value: Discipline; label: string; blurb: string }[] = [
  { value: "Mechanical", label: "Building things", blurb: "CAD, machining, hands-on assembly" },
  { value: "Electrical", label: "Circuits & power", blurb: "PCBs, power systems, sensors" },
  { value: "Firmware", label: "Code close to hardware", blurb: "Embedded systems, drivers, robotics control" },
  { value: "Software", label: "Writing software", blurb: "Apps, ML, web, backend" },
  { value: "Civil", label: "Structures & infrastructure", blurb: "Bridges, concrete, water systems" },
  { value: "Science", label: "Research & experiments", blurb: "Labs, biology, chemistry" },
  { value: "Business", label: "Strategy & operations", blurb: "Finance, marketing, running the show" },
];

const CATEGORY_OPTIONS: { value: Category; label: string; blurb: string }[] = [
  { value: "DesignTeam", label: "A build team", blurb: "Robots, cars, rockets, satellites, the whole thing" },
  { value: "Club", label: "A community club", blurb: "Lower-commitment, social, skill-building" },
  { value: "CaseComp", label: "A case comp team", blurb: "Competitive, project-based, time-boxed" },
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  const resultsHref = `/?${new URLSearchParams({
    ...(discipline ? { d: discipline } : {}),
    ...(category ? { c: category } : {}),
  }).toString()}`;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
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

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Not sure where to start?
        </h1>
        <p className="text-foreground/60">
          Two quick questions, then a filtered list. Nothing&apos;s saved,
          answer honestly or just click around.
        </p>
      </header>

      {step === 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-medium">What pulls you in most?</legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {DISCIPLINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setDiscipline(opt.value);
                  setStep(1);
                }}
                className="flex flex-col items-start gap-0.5 rounded-xl border border-border bg-surface p-4 text-left transition hover:border-accent hover:text-accent"
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-sm text-foreground/50">{opt.blurb}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-medium">What are you looking for?</legend>
          <div className="flex flex-col gap-2.5">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setCategory(opt.value);
                  setStep(2);
                }}
                className="flex flex-col items-start gap-0.5 rounded-xl border border-border bg-surface p-4 text-left transition hover:border-accent hover:text-accent"
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-sm text-foreground/50">{opt.blurb}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="w-fit text-sm text-foreground/50 underline underline-offset-2 hover:text-foreground"
          >
            Back
          </button>
        </fieldset>
      )}

      {step === 2 && (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-6">
          <p className="text-foreground/70">
            Here&apos;s what matches{" "}
            <span className="font-medium text-foreground">
              {DISCIPLINE_OPTIONS.find((o) => o.value === discipline)?.label.toLowerCase()}
            </span>{" "}
            on{" "}
            <span className="font-medium text-foreground">
              {CATEGORY_OPTIONS.find((o) => o.value === category)?.label.toLowerCase()}
            </span>
            .
          </p>
          <Link
            href={resultsHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            See results
          </Link>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="text-sm text-foreground/50 underline underline-offset-2 hover:text-foreground"
          >
            Start over
          </button>
        </div>
      )}
    </main>
  );
}
