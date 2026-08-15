import { BarChart3 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function AnalyticsPlaceholderCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">Analytics</CardTitle>
          </div>
          <Badge variant="secondary">Planned</Badge>
        </div>
        <CardDescription>Try-on conversion, product views, and size demand.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link href="/brand/analytics">Preview</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { AnalyticsPlaceholderCard };
