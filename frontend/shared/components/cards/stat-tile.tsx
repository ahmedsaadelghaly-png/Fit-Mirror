import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  /** Small supporting line under the value — a breakdown or a nudge. */
  hint?: string;
  href?: string;
  className?: string;
}

/**
 * A single headline number with its icon and label — the dashboard's
 * at-a-glance row (Shopper and Brand). The whole tile is the link when
 * `href` is set, so the hit area is generous on touch screens.
 */
function StatTile({ icon: Icon, label, value, hint, href, className }: StatTileProps) {
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-text">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {/* h3 like every sibling CardTitle, so the dashboard's heading outline is unchanged. */}
        <h3 className="text-sm font-normal text-muted-foreground">{label}</h3>
        <p className="font-display text-3xl font-semibold leading-tight">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </>
  );

  const classes = cn(
    "flex items-center gap-4 rounded-xl border bg-surface p-5 shadow-sm transition-colors",
    href &&
      "hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );

  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

export { StatTile };
