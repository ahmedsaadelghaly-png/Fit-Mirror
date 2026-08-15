import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

/** PLACEHOLDER — no session-tracking model or endpoint exists on the backend. */
function SessionOverviewPlaceholder() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Sessions</CardTitle>
          <Badge variant="secondary">Planned</Badge>
        </div>
        <CardDescription>Active devices and sign-in history.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="No session data yet" />
      </CardContent>
    </Card>
  );
}

export { SessionOverviewPlaceholder };
