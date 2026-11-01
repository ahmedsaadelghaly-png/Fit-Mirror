import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminTryOnJobRow } from "@/types/admin";

export interface FailureReasonSummaryCardProps {
  jobs: AdminTryOnJobRow[];
}

/** Aggregates the loaded jobs' error messages by frequency (the most recent 200 jobs — see api/admin/tryon-jobs.ts). */
function FailureReasonSummaryCard({ jobs }: FailureReasonSummaryCardProps) {
  const failedJobs = jobs.filter((job) => job.status === "failed" && job.error_message);
  const counts = new Map<string, number>();
  for (const job of failedJobs) {
    const reason = job.error_message as string;
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Failure reasons</CardTitle>
          <CardDescription>
            Grouped by error message, {failedJobs.length} failed jobs total
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No failed jobs.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map(([reason, count]) => (
              <li key={reason} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{reason}</span>
                <span className="font-mono text-xs">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { FailureReasonSummaryCard };
