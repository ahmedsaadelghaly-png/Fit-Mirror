import { Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TryOnJob } from "@/types/domain";

export interface QueueStatusCardProps {
  activeJobs: TryOnJob[];
}

const STATUS_COPY: Record<"pending" | "processing", string> = {
  pending: "Waiting in queue",
  processing: "Generating now",
};

/** Surfaces how many try-on jobs are currently in flight — the placeholder AI pipeline processes jobs quickly today, but this stays accurate once a real, slower model replaces it. */
function QueueStatusCard({ activeJobs }: QueueStatusCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
        <CardTitle className="text-base">Queue status</CardTitle>
      </CardHeader>
      <CardContent>
        {activeJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing in progress right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {activeJobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between text-sm">
                <span className="truncate font-mono text-xs text-muted-foreground">
                  Job {job.id.slice(0, 8)}
                </span>
                <span>{STATUS_COPY[job.status as "pending" | "processing"]}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { QueueStatusCard };
