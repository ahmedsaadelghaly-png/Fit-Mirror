# SEO & Public Page Readiness (Phase 2.6)

## Metadata helper

`lib/seo/metadata.ts`'s `buildPageMetadata()` builds a `Metadata` object
with Open Graph + Twitter Card fields and a canonical URL filled in
consistently from `config/site.ts`. Applied to the public landing page
(`app/(public)/page.tsx`) as the reference implementation. Every other
public page (`features`, `pricing`, `about`, `contact`, `privacy`,
`terms`) already exports a basic `Metadata` object with at least a
`title` (inherited into `app/layout.tsx`'s `%s · FitMirror` template) —
adopting `buildPageMetadata()` on those too (for canonical URLs and
per-page OG descriptions) is the natural next step, not done in this pass
to keep the diff focused on the highest-traffic page first.

`app/layout.tsx`'s root `metadata` now also sets `metadataBase` (required
for Next.js to resolve any relative OG/Twitter image URL against
`siteConfig.url`) and site-wide OG/Twitter defaults, so every page gets a
reasonable fallback even before adopting the per-page helper.

## Open Graph images — known gap

There is no `public/og-default.png` (or any OG image asset) in this repo
— `buildPageMetadata()`'s `ogImage` parameter is optional and omitted by
default rather than pointing at a file that doesn't exist. **Before
launch**, a designer needs to produce a 1200×630 OG image and pages should
pass it explicitly (or a shared default should be added to
`config/site.ts` once one exists).

## Sitemap

`app/sitemap.ts` (Next.js App Router convention — served at
`/sitemap.xml` automatically) lists only the public marketing routes
(`/`, `/features`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`,
`/login`, `/register`). `/shopper`, `/brand`, and `/admin` are
intentionally excluded — every route under those prefixes requires
authentication and a specific role (`middleware/auth-guard.ts`), so a
crawler can never reach past the `/login` redirect; listing them in a
sitemap would be actively misleading. `lastModified` is omitted for every
entry since there's no real per-page "last updated" tracking to report
(a fabricated date would be worse than no date).

## robots.txt

`app/robots.ts` replaces the previous static `public/robots.txt`
(`Allow: /` for everything, no sitemap reference). The new version
explicitly disallows `/shopper`, `/brand`, `/admin`, `/session-expired`,
and `/unauthorized` — same reasoning as the sitemap exclusions, saving
crawl budget on routes a crawler can never actually see content behind —
and points crawlers at `/sitemap.xml`.

## Canonical URLs

Set via `buildPageMetadata()`'s `alternates.canonical` — resolved from
`siteConfig.url` + the page's path. Prevents duplicate-content issues if
the same page is ever reachable via multiple hostnames (e.g. a staging
domain accidentally left indexable).

## Structured data (JSON-LD)

`lib/seo/structured-data.ts`'s `buildOrganizationJsonLd()` — a `schema.org`
`Organization` object rendered via a `<script type="application/ld+json">`
tag on the public landing page. This is a **placeholder**: `Product` /
`BreadcrumbList` schemas for individual store/product pages are a natural
follow-up once those pages are public-facing storefronts rather than
authenticated Brand-dashboard-only views (see
`docs/frontend/BRAND_APP.md`) — there's no public product page to attach
`Product` schema to yet.

## Privacy/Terms metadata

Both already have `title`/`description` metadata (Phase 2.2) and are
included in `sitemap.ts` — legal pages should be indexable so users can
find them via search, unlike the authenticated dashboards.

## What's NOT done in this pass

- Per-page `buildPageMetadata()` adoption beyond the landing page.
- A real OG image asset.
- `Product`/`BreadcrumbList` JSON-LD (no public product pages exist yet).
- Automatic canonical-URL generation for dynamic routes (e.g. a future
  public product page at `/store/[slug]/products/[id]`) — the helper
  supports it (`path` is just a string), but there's nothing to wire it to
  yet.
