import type { FitSummary } from "@/types/shopper";

/** "Runs small — 4 of 5 shoppers" / "True to size — ..." / null without enough agreement. */
export function describeFit(summary: FitSummary | null | undefined): string | null {
  if (!summary?.runs) return null;
  const agreeing = summary[summary.runs];
  const label = { small: "Runs small", large: "Runs large", true_to_size: "True to size" }[
    summary.runs
  ];
  return `${label} — ${agreeing} of ${summary.reports} shoppers`;
}
