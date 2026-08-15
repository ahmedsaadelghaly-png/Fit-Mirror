import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

/** PLACEHOLDER — no automated image-moderation pipeline or endpoint exists on the backend. */
function ImageModerationPlaceholder() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Image moderation</CardTitle>
          <Badge variant="secondary">Planned</Badge>
        </div>
        <CardDescription>Automated review of product and garment images.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="No moderation results yet" />
      </CardContent>
    </Card>
  );
}

export { ImageModerationPlaceholder };
