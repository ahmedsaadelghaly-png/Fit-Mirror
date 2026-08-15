import { History, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TryOnJobCard } from "@/features/tryon/components/tryon-job-card";
import type { TryOnJob } from "@/types/domain";

export interface TryOnHistorySidebarProps {
  jobs: TryOnJob[];
  isLoading: boolean;
  activeJobId: string | null;
  onSelect: (job: TryOnJob) => void;
  onRetry: (job: TryOnJob) => void;
}

function TryOnHistorySidebar({
  jobs,
  isLoading,
  activeJobId,
  onSelect,
  onRetry,
}: TryOnHistorySidebarProps) {
  return (
    <Card className="flex h-fit flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">History</CardTitle>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/shopper/tryon/history">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}

        {!isLoading && jobs.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Sparkles className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">Your past try-ons will show up here.</p>
          </div>
        )}

        {!isLoading &&
          jobs
            .slice()
            .reverse()
            .slice(0, 6)
            .map((job) => (
              <TryOnJobCard
                key={job.id}
                job={job}
                isActive={job.id === activeJobId}
                onSelect={onSelect}
                onRetry={onRetry}
              />
            ))}
      </CardContent>
    </Card>
  );
}

export { TryOnHistorySidebar };
