import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MockedBadgeProps {
  className?: string;
  label?: string;
}

/**
 * The one visual element every mocked admin data source must show per the
 * Phase 2.5 UX requirement ("clear mocked/planned labels where data is not
 * yet backed by real APIs") — see docs/frontend/ADMIN_APP.md for the full
 * inventory of what this covers (nearly everything except the real
 * backend health check).
 */
function MockedBadge({ className, label = "Mocked data" }: MockedBadgeProps) {
  return (
    <Badge variant="outline" className={cn("gap-1 border-dashed text-muted-foreground", className)}>
      <FlaskConical className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

export { MockedBadge };
