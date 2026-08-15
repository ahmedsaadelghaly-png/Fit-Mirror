import { cn } from "@/lib/utils";

/**
 * Shimmering placeholder for content that's still loading. Prefer this
 * over a spinner for anything with a known, layout-stable shape (a card,
 * a table row, an avatar) — it previews the eventual layout instead of
 * making the user wait for an unrelated spinner. See components/ui/loading-state.tsx
 * for the alternative (indeterminate, no known shape) case.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

export { Skeleton };
