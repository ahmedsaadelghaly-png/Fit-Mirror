import { Loader2, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { LookCard } from "@/shared/components/cards/look-card";
import type { TryOnJob } from "@/types/domain";

export interface RecentTryOnsCardProps {
  jobs: TryOnJob[];
}

/**
 * The latest try-ons as a uniform tile grid: finished jobs show their
 * result photo, in-flight and failed ones a same-sized status tile, so the
 * grid never mixes image tiles with text rows.
 */
function RecentTryOnsCard({ jobs }: RecentTryOnsCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Recent try-ons</CardTitle>
          <CardDescription>Your latest virtual try-on results</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/shopper/tryon/history">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
            <Sparkles className="size-6 text-primary-text" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              No try-ons yet — start your first one to see it here.
            </p>
            <Button asChild size="sm">
              <Link href="/shopper/tryon">Start a try-on</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {jobs.map((job) => (
              <li key={job.id}>
                {job.result_image_key ? (
                  <LookCard
                    imageKey={job.result_image_key}
                    alt={`Try-on result for job ${job.id.slice(0, 8)}`}
                    badge={<StatusChip status={job.status} className="scale-90" />}
                  />
                ) : (
                  <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border bg-muted/50 p-2 text-center">
                    {job.status === "failed" ? (
                      <TriangleAlert className="size-5 text-destructive" aria-hidden="true" />
                    ) : (
                      <Loader2
                        className="size-5 animate-spin text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                    <StatusChip status={job.status} className="scale-90" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { RecentTryOnsCard };
