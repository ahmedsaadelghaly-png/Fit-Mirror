import { HardDrive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

/** PLACEHOLDER — no storage usage/quota endpoint exists anywhere in the backend. See docs/frontend/ADMIN_APP.md. */
function StorageUsagePlaceholderCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">Storage usage</CardTitle>
          </div>
          <Badge variant="secondary">Planned</Badge>
        </div>
        <CardDescription>Bucket size and per-store storage consumption.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="No data yet" description="This isn't tracked yet." />
      </CardContent>
    </Card>
  );
}

export { StorageUsagePlaceholderCard };
