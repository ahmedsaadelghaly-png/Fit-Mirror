import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import type { Store } from "@/types/domain";

export interface StoreSummaryCardProps {
  store: Store;
}

function StoreSummaryCard({ store }: StoreSummaryCardProps) {
  return (
    <Card variant="elevated">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <h1 className="font-display text-2xl font-semibold">{store.name}</h1>
          <p className="text-sm text-muted-foreground">fitmirror.ai/store/{store.slug}</p>
        </div>
        {store.is_verified ? (
          <Badge variant="success" className="shrink-0">
            <CheckCircle2 className="size-3.5" /> Verified
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0">
            Verification pending
          </Badge>
        )}
      </CardHeader>
    </Card>
  );
}

export { StoreSummaryCard };
