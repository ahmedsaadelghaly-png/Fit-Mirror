import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FashionSectionProps {
  eyebrow?: string;
  heading: React.ReactNode;
  description?: React.ReactNode;
  /** Header alignment. Body content (`children`) is unaffected — only the eyebrow/heading/description block. */
  align?: "left" | "center";
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Full-bleed dark editorial panel (e.g. a section on a black ground) vs. the ordinary page background. */
  tone?: "default" | "dark";
}

/**
 * The standard page-section shell for consumer-facing (public/shopper/
 * brand) surfaces: eyebrow label, heading, optional description/actions,
 * then body content. Replaces the ad-hoc `<section className="container
 * flex flex-col items-center gap-6 py-20">` pattern that previously made
 * every section read the same regardless of content — see
 * docs/frontend/DESIGN_SYSTEM.md "Editorial layout primitives".
 *
 * Deliberately layout-only: no imagery, no card grid opinions. Compose it
 * with `FashionImage`/`LookCard`/`ProductCard`/etc. for the actual visual
 * content of `children`.
 */
function FashionSection({
  eyebrow,
  heading,
  description,
  align = "left",
  actions,
  children,
  className,
  tone = "default",
}: FashionSectionProps) {
  return (
    <section
      className={cn(
        "py-16 md:py-24",
        tone === "dark" && "bg-foreground text-background",
        className,
      )}
    >
      <div className="container">
        <div
          className={cn(
            "flex flex-col gap-4",
            align === "center" ? "items-center text-center" : "items-start text-left",
          )}
        >
          {eyebrow && (
            <Badge variant="eyebrow" className={tone === "dark" ? "text-background/60" : undefined}>
              {eyebrow}
            </Badge>
          )}
          <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {heading}
          </h2>
          {description && (
            <p
              className={cn(
                "max-w-xl text-lg",
                tone === "dark" ? "text-background/70" : "text-muted-foreground",
              )}
            >
              {description}
            </p>
          )}
          {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
        </div>
        {children && <div className="mt-12">{children}</div>}
      </div>
    </section>
  );
}

export { FashionSection };
