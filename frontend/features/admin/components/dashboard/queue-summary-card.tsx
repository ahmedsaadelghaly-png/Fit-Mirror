import { ListTree } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MockedBadge } from "@/features/admin/components/mocked-badge";

export interface QueueSummaryCardProps {
  pending: number;
  processing: number;
  failed: number;
}

function QueueSummaryCard({ pending, processing, failed }: QueueSummaryCardProps) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListTree className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Queue status</CardTitle>
        </div>
        <CardDescription>Try-on job processing queue</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-display text-xl font-semibold">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="font-display text-xl font-semibold">{processing}</p>
            <p className="text-xs text-muted-foreground">Processing</p>
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-destructive">{failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <MockedBadge />
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/queue">Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { QueueSummaryCard };
