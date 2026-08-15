import { Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface TryOnActivityCardProps {
  tryOnJobCount: number;
  completedTryOnCount: number;
  failedTryOnCount: number;
}

function TryOnActivityCard({
  tryOnJobCount,
  completedTryOnCount,
  failedTryOnCount,
}: TryOnActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Try-on activity</CardTitle>
        </div>
        <CardDescription>Across every product in your catalog</CardDescription>
      </CardHeader>
      <CardContent>
        {tryOnJobCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            No try-ons yet — shoppers haven&apos;t tried on your products.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-display text-2xl font-semibold">{tryOnJobCount}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold text-success">
                {completedTryOnCount}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold text-destructive">
                {failedTryOnCount}
              </p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { TryOnActivityCard };
