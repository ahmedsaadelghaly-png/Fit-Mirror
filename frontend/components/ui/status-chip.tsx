import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatusChipStatus = "pending" | "processing" | "completed" | "failed";

const statusConfig: Record<
  StatusChipStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  pending: {
    label: "Pending",
    icon: CircleDashed,
    className: "bg-muted text-muted-foreground",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "bg-accent text-accent-foreground",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-success/15 text-success",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-destructive/15 text-destructive",
  },
};

export interface StatusChipProps {
  status: StatusChipStatus;
  className?: string;
}

/**
 * Renders the four `tryon_jobs.status` values (see backend
 * docs/ERD.md) with a consistent icon/color mapping used everywhere a
 * job status appears — never re-derive this mapping ad hoc in a page.
 */
function StatusChip({ status, className }: StatusChipProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon
        className={cn("size-3.5", status === "processing" && "animate-spin")}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}

export { StatusChip };
