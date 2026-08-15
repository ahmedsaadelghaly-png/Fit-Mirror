import { Boxes } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function InventoryPlaceholderCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">Inventory</CardTitle>
          </div>
          <Badge variant="secondary">Planned</Badge>
        </div>
        <CardDescription>Low-stock alerts and bulk stock updates.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link href="/brand/inventory">Preview</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { InventoryPlaceholderCard };
