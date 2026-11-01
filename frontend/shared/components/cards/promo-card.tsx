import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { FashionImage } from "@/shared/components/fashion-image";

export interface PromoCardProps {
  /** Static photo under public/images/. */
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  /** Small chip over the photo, e.g. "Beta". */
  badge?: string;
  className?: string;
}

/**
 * Photo-led entry point to a feature (AI Stylist, Shopping Assistant,
 * catalog, ...) — the image does the selling, copy stays short. The whole
 * card is one link.
 */
function PromoCard({
  image,
  imageAlt,
  title,
  description,
  href,
  cta,
  badge,
  className,
}: PromoCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[15rem] overflow-hidden rounded-xl text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <FashionImage
        src={image}
        alt={imageAlt}
        aspect="landscape"
        className="absolute inset-0 aspect-auto h-full w-full transition-transform duration-700 ease-signature group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-black">
          {badge}
        </span>
      )}
      <div className="relative mt-auto flex flex-col gap-1.5 p-5">
        <p className="font-display text-xl font-semibold">{title}</p>
        <p className="text-sm text-white/80">{description}</p>
        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-white">
          {cta}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

export { PromoCard };
