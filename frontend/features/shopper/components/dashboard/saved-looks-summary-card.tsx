import { Heart } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface SavedLooksSummaryCardProps {
  lookCount: number;
}

function SavedLooksSummaryCard({ lookCount }: SavedLooksSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Saved looks</CardTitle>
        </div>
        <CardDescription>Try-on results you kept for later</CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <span className="font-display text-3xl font-semibold">{lookCount}</span>
        <Button asChild variant="outline" size="sm">
          <Link href="/shopper/looks">{lookCount === 0 ? "See how" : "View looks"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { SavedLooksSummaryCard };
