import { BarChart3 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function AnalyticsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">Analytics</CardTitle>
          </div>
        </div>
        <CardDescription>Most tried products, size demand and fit feedback.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link href="/brand/analytics">View analytics</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { AnalyticsCard };
