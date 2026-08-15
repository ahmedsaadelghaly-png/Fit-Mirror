import { Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import type { TryOnJob } from "@/types/domain";

export interface RecentTryOnsCardProps {
  jobs: TryOnJob[];
}

function RecentTryOnsCard({ jobs }: RecentTryOnsCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Recent try-ons</CardTitle>
          <CardDescription>Your latest virtual try-on jobs</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/shopper/tryon/history">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Sparkles className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              No try-ons yet — start your first one to see it here.
            </p>
            <Button asChild size="sm">
              <Link href="/shopper/tryon">Start a try-on</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-3">
                <span className="truncate font-mono text-xs text-muted-foreground">
                  Job {job.id.slice(0, 8)}
                </span>
                <StatusChip status={job.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { RecentTryOnsCard };
