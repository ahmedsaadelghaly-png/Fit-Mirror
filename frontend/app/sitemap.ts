import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Dynamic sitemap — Next.js serves this at `/sitemap.xml` automatically
 * (App Router convention, see
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap).
 * Only the public marketing routes are listed — every `/shopper`,
 * `/brand`, and `/admin` route requires auth and role membership, so
 * indexing them would be meaningless (a crawler can never reach past the
 * login redirect) and is explicitly excluded here rather than left to
 * `robots.ts` alone. See docs/frontend/SEO.md "Sitemap".
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/features", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/pricing", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/login", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/register", changeFrequency: "yearly" as const, priority: 0.6 },
  ];

  // No per-page "last updated" tracking exists yet, so `lastModified` is
  // omitted entirely rather than filled with a fake/misleading date — see
  // docs/frontend/SEO.md "Sitemap".
  return publicRoutes.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
