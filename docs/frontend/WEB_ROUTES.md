# Web Routes

## Route table (as of Phase 2.2)

| Route | Route group | Layout | Auth | Status |
|---|---|---|---|---|
| `/` | `(public)` | `PublicLayout` | public | real content (marketing home) |
| `/features` | `(public)` | `PublicLayout` | public | real content |
| `/pricing` | `(public)` | `PublicLayout` | public | explicit placeholder — see `docs/frontend/PUBLIC_PAGES.md` |
| `/about` | `(public)` | `PublicLayout` | public | real content |
| `/contact` | `(public)` | `PublicLayout` | public | real form, placeholder backend adapter |
| `/privacy` | `(public)` | `PublicLayout` | public | explicit placeholder |
| `/terms` | `(public)` | `PublicLayout` | public | explicit placeholder |
| `/login` | `(auth)` | `AuthLayout` | guest-only | real, calls backend, real session persistence |
| `/register` | `(auth)` | `AuthLayout` | guest-only | real, calls backend |
| `/forgot-password` | `(auth)` | `AuthLayout` | guest-only | real form, placeholder backend adapter |
| `/session-expired` | `(auth)` | `AuthLayout` | public | real — reached by `api/client.ts` on failed refresh |
| `/unauthorized` | `(auth)` | `AuthLayout` | public | real — reached by middleware on role mismatch |
| `/shopper` | `(shopper)` | `ShopperDashboardLayout` | shopper only | placeholder content, real layout **and now real route protection** |
| `/brand` | `(brand)` | `BrandDashboardLayout` | brand_admin only | placeholder content, real layout **and now real route protection** |
| `/admin` | `(admin)` | `AdminDashboardLayout` | platform_admin only | placeholder content, real layout **and now real route protection** |
| (unmatched route) | — | manual `PublicHeader`/`PublicFooter` | public | `app/not-found.tsx` — custom 404 |

"Auth" is no longer "(planned)" as of Phase 2.2 — `middleware.ts` +
`middleware/auth-guard.ts` actually enforce every row above. See
`docs/frontend/AUTHENTICATION.md` for the full route-protection logic and
`tests/e2e/smoke.spec.ts` "Route protection (middleware)" for the tests
proving it. "Placeholder content, real layout" still means the route,
layout, AND now the auth gate are real and build-verified (see
`docs/frontend/FRONTEND_ARCHITECTURE.md`'s verification note) — only the
*page content inside the layout* is a stand-in for a finished feature.

## Planned routes (not built — shown in nav as "Coming soon")

These appear disabled in `DashboardSidebar`/`MobileNav` (see
`config/navigation.ts`) so the full information architecture is visible
without faking pages that don't exist:

| Route | Area | Depends on (backend) |
|---|---|---|
| `/shopper/wardrobe` | Shopper | `GET/POST/DELETE /wardrobe` (implemented) |
| `/shopper/tryon` | Shopper | `POST /tryon`, `GET /tryon/{id}` (implemented) |
| `/shopper/shopping` | Shopper | `POST /shopping/ask` (backend: `501`, planned) |
| `/brand/products` | Brand | `GET/POST /store/products` (implemented) |
| `/brand/analytics` | Brand | `GET /store/me/summary` (implemented) + planned extensions |
| `/admin/users` | Admin | Planned admin endpoints (see backend `docs/RBAC.md`) |
| `/admin/stores` | Admin | Planned store verification workflow |

## Route groups: why the folder names have parentheses

`app/(public)/page.tsx`, `app/(auth)/login/page.tsx`, etc. — the
parenthesized segment is a Next.js **route group**: it organizes files and
lets each group have its own `layout.tsx` without adding a path segment to
the URL. `(shopper)/shopper/page.tsx` serves `/shopper`, not
`/(shopper)/shopper`. This is why there's a `shopper/` folder *inside*
`(shopper)/` — the group provides the layout, the inner folder provides
the actual path segment.

## Layout inheritance

```
app/layout.tsx (root: fonts, AppProviders, skip link)
├── app/(public)/layout.tsx -> PublicLayout
│   └── app/(public)/page.tsx
├── app/(auth)/layout.tsx -> AuthLayout
│   ├── app/(auth)/login/page.tsx
│   └── app/(auth)/register/page.tsx
├── app/(shopper)/layout.tsx -> ShopperDashboardLayout
│   └── app/(shopper)/shopper/page.tsx
├── app/(brand)/layout.tsx -> BrandDashboardLayout
│   └── app/(brand)/brand/page.tsx
└── app/(admin)/layout.tsx -> AdminDashboardLayout
    └── app/(admin)/admin/page.tsx
```

Every route group's `layout.tsx` is a one-line wrapper delegating to the
matching component in `layouts/` — see
`docs/frontend/FRONTEND_ARCHITECTURE.md` for why the actual layout
implementation lives in `layouts/`, not inline in `app/`.

## Middleware

`middleware.ts` (project root, required location) now matches nearly
every route (`config.matcher` excludes only static assets) and enforces
real session/role checks via `middleware/auth-guard.ts` — see
`docs/frontend/AUTHENTICATION.md` for the full decision table (public /
guest-only / authenticated+role-scoped) and the reasoning behind each
redirect target (`/login`, `/session-expired`, `/unauthorized`).

## Adding a new route

1. Decide which route group it belongs to (or whether it needs a new one).
2. Add the folder/`page.tsx` under the correct `(group)/` — the URL is
   determined by every folder segment *except* the parenthesized one(s).
3. If it's a real feature page (not a layout-validation placeholder), put
   its logic in `features/<area>/` and have the page just render it (see
   `app/(auth)/login/page.tsx` for the reference: a two-line page
   rendering `features/auth/components/login-form.tsx`).
4. If it should appear in a dashboard's sidebar, add it to the relevant
   array in `config/navigation.ts` — remove `comingSoon: true` once the
   page has real content, not before.
