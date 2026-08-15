import { siteConfig } from "@/config/site";

/**
 * JSON-LD structured data — PLACEHOLDER. Only an `Organization` schema is
 * built today (rendered on the public landing page via a `<script
 * type="application/ld+json">` tag); `Product`/`BreadcrumbList` schemas for
 * individual store/product pages are a natural follow-up once those pages
 * are public-facing (today's Brand product pages are dashboard-only, not
 * public storefronts — see docs/frontend/BRAND_APP.md). See
 * docs/frontend/SEO.md "Structured data".
 */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };
}
