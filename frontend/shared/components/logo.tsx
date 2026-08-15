import Link from "next/link";

import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  href?: string;
}

/**
 * Text wordmark, not an image asset — keeps the logo crisp at any size
 * and themeable via currentColor without shipping an SVG/PNG per theme.
 * The single brass dot after "Fit" is the signature mark: a literal
 * "reflection point" nod to the product name, used nowhere else in the
 * UI at this size/weight so it stays a distinctive, recognizable mark.
 */
function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-0.5 font-display text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <span>Fit</span>
      <span className="text-primary">•</span>
      <span>Mirror</span>
    </Link>
  );
}

export { Logo };
