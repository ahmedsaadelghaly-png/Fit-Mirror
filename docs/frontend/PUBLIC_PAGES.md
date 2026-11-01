# Public Pages

## Page inventory

| Route | Status | Notes |
|---|---|---|
| `/` | Real | Landing page — hero + capability cards (see `app/(public)/page.tsx`) |
| `/features` | Real | Feature list with honest "Coming soon" badges on unbuilt features |
| `/pricing` | **Explicit placeholder** | No pricing model decided yet — see the page's docstring |
| `/about` | Real | Static copy |
| `/contact` | Real | `POST /contact` — see "Contact form" below |
| `/privacy` | **Explicit placeholder** | Needs legal review before it's real |
| `/terms` | **Explicit placeholder** | Needs legal review before it's real |
| `/not-found` (404) | Real | Custom, on-brand 404 — see `app/not-found.tsx` |
| Route error (500) | Real | `app/error.tsx` (route-level) + `app/global-error.tsx` (root-layout-level) |

"Real" means the page is intended to be final-ish copy/structure for
Phase 2.2's scope, not a layout-only placeholder — though none of these
pages are business-critical (no checkout, no account data), so "real"
here means "a genuine attempt at the actual page", not "load-bearing
production content".

## Layout: `PublicHeader` / `PublicFooter`

Extracted from `layouts/public-layout.tsx` into
`shared/components/public-header.tsx` and `public-footer.tsx` specifically
so every page above shares identical chrome without copy-pasting header/
footer markup into each one. `app/(public)/layout.tsx` wraps every route
in this group with `PublicLayout`, so an individual page file (e.g.
`app/(public)/about/page.tsx`) contains *only* its own content.

### `PublicHeader` responsive behavior

Below `md`, the nav links (`config/navigation.ts::publicNav` — Features,
Pricing, About, Contact) and the Log in/Get started buttons collapse into
a dropdown menu behind a hamburger button, rather than a full-screen
sheet. This differs from the dashboard layouts'
`layouts/mobile-nav.tsx` (a full slide-over sheet) deliberately: marketing
nav is four short links, a sheet would be a heavier UI than the content
warrants; dashboard nav is longer and icon-led, where a sheet reads better.

### `PublicFooter` link columns

Driven by `config/navigation.ts::footerLinks` — three columns (Product,
Company, Legal), each a list of `{label, href}`. Adding a new footer link
means editing that one config array, not the footer component.

## Contact form

`features/contact/` follows the exact same shape as `features/auth/`:
`schemas.ts` (Zod), `api.ts` (the actual call), `hooks/use-contact-form.ts`
(TanStack Query mutation), `components/contact-form.tsx` (the form).
`submitContactForm` calls `POST /contact` (Phase 3.2): the message is
stored in the support inbox platform admins work through at
`/admin/support`, and forwarded to the support address with the sender as
Reply-To.

## 404 page (`app/not-found.tsx`)

Next.js renders this for any unmatched route, app-wide. It sits **outside
every route group** (it's not inside `(public)/`), so it does **not**
automatically inherit `PublicLayout` the way `app/(public)/about/page.tsx`
does. `PublicHeader`/`PublicFooter` are imported and rendered manually
here for that reason — otherwise a 404 would render bare, unstyled
content, which reads as broken rather than intentional.

## Error boundaries (`app/error.tsx`, `app/global-error.tsx`)

Two files, two different failure scopes:

- **`app/error.tsx`** — a Client Component error boundary Next.js renders
  automatically when a page (or anything it renders) throws, below the
  root layout. Reuses `PublicHeader`/`PublicFooter` the same way
  `not-found.tsx` does, plus a "Try again" button (calls the `reset()`
  callback Next.js provides) and a "Back to home" link.
- **`app/global-error.tsx`** — catches errors thrown by the **root layout
  itself** (`app/layout.tsx`) or anything above `error.tsx`'s boundary.
  Next.js requires this file to render its own complete `<html>`/`<body>`,
  since the root layout that would normally provide them may be the very
  thing that failed. It deliberately does **not** import
  `PublicHeader`/design tokens/fonts/providers — none of those can be
  assumed to be working if this file is rendering — and uses inline
  styles instead of Tailwind classes for the same reason (no guarantee
  Tailwind's stylesheet loaded correctly if something this fundamental
  broke).

## SEO / metadata

Every page sets its own `metadata` export (Next.js App Router convention)
— at minimum a `title`, and a `description` where the page's purpose isn't
obvious from the title alone (e.g. `/pricing`'s description notes it's
not final). The root layout (`app/layout.tsx`) sets a `title.template` so
every page's title renders as `"<Page> · FitMirror"` rather than each
page needing to repeat the site name.
