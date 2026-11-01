import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface EditorialHeroProps {
  eyebrow?: string;
  heading: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** The visual half of the composition — typically a `FashionImage`/`EditorialImage`/`ModelImage`, or a small mosaic of them. */
  media: React.ReactNode;
  /** Puts the media column on the left instead of the right. */
  reverse?: boolean;
  tone?: "default" | "dark";
  className?: string;
  /**
   * `h1` (default) for the single page hero. Use `h2` when this same
   * composition repeats as a narrative section further down a page — a
   * page should have exactly one `h1`, so a "story panel" sequence (e.g.
   * the landing page's per-capability sections) must not render several.
   */
  headingLevel?: "h1" | "h2";
}

/**
 * The large asymmetric two-column composition used for every "moment"
 * page needs to make an editorial case for itself: the landing hero, a
 * feature-story section, the auth-panel narrative. Copy never spans the
 * full width opposite a full-bleed image column, and the image is a real
 * compositional half of the layout, not a decorative corner icon — see
 * docs/frontend/DESIGN_SYSTEM.md "Editorial layout primitives" for the
 * "fashion first" rationale.
 *
 * Framework-agnostic (no next/link) so it stays Storybook-safe — pass
 * `actions` as pre-built `<Button asChild><Link .../></Button>` elements
 * from the calling page.
 */
function EditorialHero({
  eyebrow,
  heading,
  description,
  actions,
  media,
  reverse = false,
  tone = "default",
  className,
  headingLevel = "h1",
}: EditorialHeroProps) {
  const Heading = headingLevel;

  return (
    <section
      className={cn(
        "overflow-hidden",
        tone === "dark" && "bg-foreground text-background",
        className,
      )}
    >
      <div className="container grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
        <div className={cn("flex flex-col items-start gap-5 text-left", reverse && "lg:order-2")}>
          {eyebrow && (
            <Badge variant="eyebrow" className={tone === "dark" ? "text-background/60" : undefined}>
              {eyebrow}
            </Badge>
          )}
          <Heading
            className={cn(
              "font-display font-semibold leading-[1.05] tracking-tight",
              headingLevel === "h1" ? "text-4xl md:text-5xl lg:text-6xl" : "text-3xl md:text-4xl",
            )}
          >
            {heading}
          </Heading>
          {description && (
            <p
              className={cn(
                "max-w-md text-lg",
                tone === "dark" ? "text-background/70" : "text-muted-foreground",
              )}
            >
              {description}
            </p>
          )}
          {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
        </div>

        <div className={cn(reverse && "lg:order-1")}>{media}</div>
      </div>
    </section>
  );
}

export { EditorialHero };
