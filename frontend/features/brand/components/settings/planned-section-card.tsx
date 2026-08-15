import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export interface PlannedSectionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  emptyStateTitle: string;
}

/** Shared shell for the Brand Settings placeholders (billing, team, API integration) — none have any backend support yet. */
function PlannedSectionCard({
  icon: Icon,
  title,
  description,
  emptyStateTitle,
}: PlannedSectionCardProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Badge variant="secondary">Planned</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title={emptyStateTitle} />
      </CardContent>
    </Card>
  );
}

export { PlannedSectionCard };
