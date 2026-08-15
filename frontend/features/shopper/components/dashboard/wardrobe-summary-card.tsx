import { Shirt } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface WardrobeSummaryCardProps {
  itemCount: number;
}

function WardrobeSummaryCard({ itemCount }: WardrobeSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shirt className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Wardrobe</CardTitle>
        </div>
        <CardDescription>Pieces you own, ready to try on</CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <span className="font-display text-3xl font-semibold">{itemCount}</span>
        <Button asChild variant="outline" size="sm">
          <Link href="/shopper/wardrobe">{itemCount === 0 ? "Add items" : "Manage"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { WardrobeSummaryCard };
