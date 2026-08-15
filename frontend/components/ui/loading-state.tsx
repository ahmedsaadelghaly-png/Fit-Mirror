import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

/**
 * Use for indeterminate loading with no known content shape (e.g. a page
 * transition, a submit-and-wait action). When the eventual layout IS
 * known (a list, a card grid), prefer components/ui/skeleton.tsx instead —
 * it previews the shape rather than making the user wait on a spinner.
 */
function LoadingState({ label = "Loading…", className }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export { LoadingState };
