import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export interface PageSeoOptions {
  title: string;
  description?: string;
  /** Path only (e.g. "/features") — resolved against siteConfig.url for the canonical URL and OG url. */
  path?: string;
  /** Set false for pages that shouldn't be indexed (e.g. auth pages) — see docs/frontend/SEO.md. */
  indexable?: boolean;
  /**
   * No default image is set here on purpose — there is no
   * `public/og-default.png` asset in this repo yet (a 1200×630 OG image is
   * a design deliverable, not something this pass can generate). Pass one
   * explicitly once it exists; see docs/frontend/SEO.md "Open Graph
   * images — known gap".
   */
  ogImage?: string;
}

/**
 * Builds a `Metadata` object with Open Graph + Twitter Card fields and a
 * canonical URL filled in consistently, so individual pages only supply
 * what's actually page-specific. See docs/frontend/SEO.md "Metadata
 * helper". `app/layout.tsx`'s root `metadata` still owns the site-wide
 * title template (`%s · FitMirror`) — this only needs to set `title` as a
 * plain string, not repeat the template.
 */
export function buildPageMetadata({
  title,
  description = siteConfig.description,
  path = "",
  indexable = true,
  ogImage,
}: PageSeoOptions): Metadata {
  const url = `${siteConfig.url}${path}`;
  const images = ogImage ? [{ url: ogImage }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images,
      type: "website",
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}
