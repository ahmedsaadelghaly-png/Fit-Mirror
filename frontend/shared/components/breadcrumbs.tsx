import { ChevronRight } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * PLACEHOLDER — renders whatever `items` a page passes in, but no page in
 * Phase 2.1 passes anything beyond a single root item yet (there's no
 * nested route depth to reflect). Wired up now so dashboard layouts have a
 * real breadcrumb slot instead of empty header space once deeper routes
 * (e.g. /shopper/wardrobe/item_id) exist.
 */
function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? "font-medium text-foreground" : undefined}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export { Breadcrumbs };
