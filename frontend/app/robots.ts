import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Dynamic robots.txt — served at `/robots.txt` (App Router convention).
 * Replaces the previous static `public/robots.txt` (which only had
 * `Allow: /` for everything) — this version explicitly disallows
 * `/shopper`, `/brand`, and `/admin`: those routes 302-redirect
 * unauthenticated crawlers to `/login` anyway (see
 * `middleware/auth-guard.ts`), so disallowing them outright saves crawl
 * budget rather than letting a crawler repeatedly hit a redirect it can
 * never get past. See docs/frontend/SEO.md "robots.txt".
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/shopper", "/brand", "/admin", "/session-expired", "/unauthorized"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
