import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center transition-colors", {
  variants: {
    variant: {
      default:
        "gap-1 rounded-full border border-transparent bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground",
      secondary:
        "gap-1 rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground",
      outline:
        "gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground",
      success:
        "gap-1 rounded-full border border-transparent bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success",
      warning:
        "gap-1 rounded-full border border-transparent bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning",
      destructive:
        "gap-1 rounded-full border border-transparent bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive",
      /**
       * Editorial section label — a tracked uppercase word with a short
       * leading rule, not a pill. Replaces the "icon + pill badge" pattern
       * (e.g. a sparkle icon reading "AI-powered...") that reads as a
       * generic AI-product cliche — see docs/frontend/DESIGN_SYSTEM.md
       * "Eyebrow labels". Used for section kickers, not status/count badges.
       */
      eyebrow:
        "gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground before:h-px before:w-6 before:bg-primary-text before:content-['']",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
