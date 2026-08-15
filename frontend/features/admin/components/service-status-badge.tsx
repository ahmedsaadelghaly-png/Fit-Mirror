import { AlertTriangle, CheckCircle2, CircleHelp, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ServiceStatus } from "@/types/admin";

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  healthy: { label: "Healthy", icon: CheckCircle2, className: "bg-success/15 text-success" },
  degraded: { label: "Degraded", icon: AlertTriangle, className: "bg-warning/15 text-warning" },
  down: { label: "Down", icon: XCircle, className: "bg-destructive/15 text-destructive" },
  unknown: { label: "Unknown", icon: CircleHelp, className: "bg-muted text-muted-foreground" },
};

export interface ServiceStatusBadgeProps {
  status: ServiceStatus;
  className?: string;
}

/** The status-mapping equivalent of components/ui/status-chip.tsx, but for platform/service health rather than try-on job status — never re-derive this mapping ad hoc. */
function ServiceStatusBadge({ status, className }: ServiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}

export { ServiceStatusBadge };
