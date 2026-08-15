import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * `default` is the original dashboard-card treatment (bordered, subtle
 * shadow) — kept as-is for Admin/data-table contexts where a card is a
 * container, not the content. The other variants exist for consumer-
 * facing fashion surfaces, where a bordered-box-with-shadow reads as
 * generic SaaS chrome around what should be the star of the layout: the
 * imagery. See docs/frontend/DESIGN_SYSTEM.md "Card variants".
 */
const cardVariants = cva("text-surface-foreground", {
  variants: {
    variant: {
      /** Original treatment — bordered box, subtle shadow. Admin/data contexts. */
      default: "rounded-lg border bg-surface shadow-xs",
      /** No border, no shadow, no fill — content sits directly on the page. Editorial copy blocks. */
      flush: "rounded-none bg-transparent",
      /** Image-forward: no padding chrome baked in, crisp corners, hairline border only. */
      media: "overflow-hidden rounded-md border border-border/60 bg-surface",
      /** Slightly more lift than `default` — floating panels, featured callouts. */
      elevated: "rounded-lg border border-border/50 bg-surface shadow-md",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display text-xl font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
