# Brand / Store Web App (Phase 2.4)

The full Brand/Store experience: dashboard, store onboarding, store
profile/settings, product management (list/create/edit/details),
variants, inventory, analytics (placeholder), customers (placeholder),
orders (placeholder), and brand-level settings. Everything under
`app/(brand)/brand/*` is now real — no more static placeholder page.
Admin dashboard and mobile app remain out of scope, per the Phase 2.4
brief.

## Folder structure

```
frontend/
  types/brand.ts                          Request/response + frontend-only types (StoreBusinessInfo, ProductOverlay, ...)
  api/brand/
    store.ts                              GET /store/me, POST /store, GET /store/me/summary
    products.ts                           POST/GET /store/products
    store-local.ts                        localStorage-backed StoreBusinessInfo placeholder
    product-overlay.ts                    localStorage-backed product edit/archive/active-toggle/variant CRUD placeholder
  features/brand/
    schemas.ts                            Zod: store basics, business info, product, variant
    lib/
      resolve-product.ts                  Pure adapter: server Product + local overlay → ResolvedProduct
      dashboard-summary-adapter.ts        Pure adapter: summary + products + business info → dashboard view model
    hooks/                                One TanStack Query hook per file (store, products, overlays, business info, onboarding)
    components/
      require-store.tsx                  Shared loading/needs-setup/error/success gate every store-scoped page renders through
      dashboard/                          Store summary, product count, try-on activity, setup checklist, recent products, quick actions, inventory/analytics placeholder cards
      onboarding/                        5-step stepper (basics, logo, details, social, completion)
      profile/                           Store identity (read-only), business info form, verification status, notification placeholder
      products/                          Filters, table, status badge, create/edit form, details view, variant list + form dialog
      inventory/                         Real stock-quantity table across all variants + bulk-update placeholder
      analytics/, customers/, orders/    Placeholder views, clearly badged "Planned"
      settings/                          Account (read-only), store-settings link, billing/team/API placeholders
  app/(brand)/brand/
    page.tsx                              Dashboard
    onboarding/page.tsx
    profile/page.tsx                      Store profile
    products/page.tsx                     List
    products/new/page.tsx                 Create
    products/[id]/page.tsx                Details
    products/[id]/edit/page.tsx           Edit
    inventory/page.tsx
    analytics/page.tsx
    customers/page.tsx
    orders/page.tsx
    settings/page.tsx
```

Every `page.tsx` is a thin server component that sets `metadata` and
renders one client `*View`/`*Flow` component, same pattern as Phase 2.3.

## API integration

| Feature | Backend endpoint(s) | Status |
|---|---|---|
| Store creation | `POST /store` | Real |
| Store read | `GET /store/me` | Real — 404 drives the onboarding redirect |
| Store summary | `GET /store/me/summary` | Real |
| Product list/create | `GET/POST /store/products` | Real |
| Store edit (business info, logo) | none | **Frontend placeholder** — localStorage, see below |
| Product edit/archive/active-toggle | none | **Frontend placeholder** — localStorage, see below |
| Product variants (add/edit/delete) | none | **Frontend placeholder** — localStorage, see below |
| Single product detail | none | Derived from the list query cache, see below |
| Inventory stock levels | derived from `GET /store/products` | Real (read), no bulk-update endpoint |
| Analytics | none | Placeholder, clearly badged "Planned" |
| Customers | none | Placeholder |
| Orders | none | Placeholder |
| Store verification | `is_verified` readable via `StoreRead` | Read-only, no request/trigger endpoint |
| Settings → Account | `GET /users/me` | Real, read-only (same gap as Shopper's settings) |

## API contract mismatches (documented per the Phase 2.4 rules)

The backend's `Store`/`Product` surface is deliberately minimal — read the
actual schemas/routers (`backend/app/schemas/store.py`,
`backend/app/schemas/product.py`,
`backend/app/api/v1/endpoints/store_dashboard.py`) rather than assume
parity with the spec. Confirmed gaps:

1. **No store update endpoint at all.** `StoreCreate` is exactly
   `{name, slug}`; there is no `PUT/PATCH /store` or `/store/me` anywhere
   in the codebase, and no service/repository method for it either. Store
   name and slug are therefore **read-only** after creation in
   `StoreIdentitySection` — there's nothing to edit them against.

2. **`category`, `description`, and `social_links` don't exist on the
   `Store` model at all** — not read-only, not planned in a schema,
   completely absent. Captured as `StoreBusinessInfo` (`types/brand.ts`),
   persisted to `localStorage` per store via
   `features/brand/hooks/use-store-business-info.ts`, following the exact
   pattern `features/shopper/hooks/use-style-preferences.ts` established
   in Phase 2.3.

3. **Logo upload has nowhere to go.** `StoreRead.logo_image_key` is
   readable but nothing can ever set it server-side (no store-update
   endpoint). The logo upload flow (`POST /tryon/upload-url` → direct
   `PUT`) still works — it's the same generic pre-signed-URL mechanism
   used everywhere — but the resulting key is namespaced `user-photos/...`
   (the `tryon.py` route hardcodes that namespace; it isn't
   caller-configurable) and is saved to the local `StoreBusinessInfo`
   overlay, not the real `Store.logo_image_key`.

4. **No product edit, archive, or active-toggle endpoint.** Only
   `POST /store/products` (create) and `GET /store/products` (list) exist
   — confirmed by reading the router directly, not by an OpenAPI gap.
   `ProductCreate` also has no `is_active` field (the model defaults it to
   `true` server-side) and no `variants` field. All three — editing,
   archiving, and the active/inactive toggle — are handled by a
   localStorage `ProductOverlay` per product
   (`api/brand/product-overlay.ts`), merged onto the server's `ProductRead`
   for display by the pure adapter `features/brand/lib/resolve-product.ts`.

5. **No product-variant endpoint of any kind.** No
   `ProductVariantCreate`/`Update` schema, no route — variants can only be
   seeded directly in the database (see `backend/app/db/seed.py`). "Add
   variant" and "Edit variant" (explicitly flagged in the Phase 2.4 spec as
   a placeholder if the backend is unavailable) both write to the same
   `ProductOverlay.variants` array in localStorage.

6. **No single-product GET.** There's no `GET /store/products/{id}` —
   product details/edit pages derive the one product they need from the
   same `GET /store/products` list query cache `useProducts()` populates
   (`features/brand/hooks/use-product.ts`, same query key
   `["brand", "products"]`). Arriving from the products list is instant
   (cache already warm); a direct link or refresh triggers one full-list
   fetch to find it.

7. **Store verification has no workflow.** `is_verified` is readable but
   always `false` on `POST /store` (the seed script sets `true` directly in
   the DB) — `docs/RBAC.md` explicitly lists "verify a store" as planned,
   `platform_admin`-only, not implemented. `VerificationStatusSection` is
   read-only display, not a request form.

8. **No analytics, customers, or orders data model exists at all** — no
   endpoints, no schemas. Per the spec, these are placeholder views
   clearly badged "Planned," not disabled/broken forms pretending to be
   real.

9. **`Product` carries no timestamp field**, so "recent products" on the
   dashboard approximates recency by reversing the list endpoint's
   insertion order (same adaptation Phase 2.3 used for `TryOnJob`).

## The `ProductOverlay` pattern

Every product-level "placeholder" feature (edit, archive, active toggle,
variants) shares one localStorage-backed overlay per product
(`api/brand/product-overlay.ts`), keyed `fitmirror.product-overlay.{id}`.
`features/brand/lib/resolve-product.ts` is the single pure function that
merges a server `Product` with its overlay into a `ResolvedProduct` —
every list, table, and detail view renders through this adapter so the
merge logic exists in exactly one place. This mirrors the
`api/shopper/saved-looks.ts` pattern from Phase 2.3: real, interactive UI,
clearly not yet synced to a backend that doesn't support it.

Products marked archived are excluded from every status filter except an
explicit "Archived" filter (`features/brand/components/products/product-
filters-bar.tsx`), so an archived product stays reachable to unarchive
rather than disappearing permanently.

## Store onboarding

Only the **basics** step (name + slug) persists to a real `POST /store`
call — everything else (logo, category/description, social links) writes
to the localStorage `StoreBusinessInfo` overlay. Unlike Phase 2.3's
Shopper onboarding, this stepper doesn't need "resume mid-flow" to
reconcile server state across steps, since only one step ever calls the
backend; `features/brand/hooks/use-store-onboarding.ts` still persists
step progress per user so a refresh mid-flow resumes at the same step.

## Testing

Unit tests (Vitest + Testing Library), added under `tests/unit/`:

- `features/brand-schemas.test.ts` — store onboarding validation
  (`storeBasicsSchema`, `slugify`), product form validation
  (`productSchema`, `variantSchema`)
- `features/brand-product-hooks.test.tsx` — `useProducts` (list +
  client-side filtering) and `useCreateProduct`, with `@/api/brand/products`
  mocked
- `features/dashboard-summary-adapter.test.ts` — the pure dashboard
  summary adapter (counts, recency approximation, setup-checklist
  completion)
- `features/resolve-product.test.ts` — the pure product-overlay merge
  adapter (field overrides, active override, archived flag, variant
  replacement)

The media upload utility (`validateImageFile`, `requestUploadUrl`,
`putFileToUploadUrl`) is reused unchanged from Phase 2.3 — no new upload
logic was introduced for Brand, so it's already covered by
`tests/unit/api/upload.test.ts` and wasn't duplicated here.

Playwright smoke tests, added at `tests/e2e/brand-smoke.spec.ts`:

- Brand dashboard (existing store, and the "needs setup" prompt for a
  brand admin with no store yet)
- Store onboarding (creating a store via the basics step)
- Products list (empty state, and a populated table)
- Create product (form submission calling `POST /store/products`)
- Product details (info + variants section)
- Route-protection checks for the new Brand routes

Same approach as `tests/e2e/shopper-smoke.spec.ts`: a `fm_access_token`
cookie holding an unsigned-but-well-formed JWT with a `brand_admin` role
claim, with backend endpoints stubbed via `page.route`.

Storybook: five new component stories for Brand-specific components that
don't depend on `next/link` — see `docs/frontend/STORYBOOK.md` "Stories
written (Phase 2.4)".

## Run / test commands

```bash
cd frontend
npm install

# Type check / lint
npm run typecheck
npm run lint

# Unit tests
npm run test
npm run test:coverage

# Playwright e2e (starts its own dev server; backend calls are mocked in the brand smoke tests)
npx playwright install     # one-time
npm run test:e2e

# Storybook
npm run storybook           # http://localhost:6006
npm run build-storybook     # verifies all stories compile

# Dev server
npm run dev                 # http://localhost:3000/brand — needs backend + Postgres/Redis + S3-compatible storage running for real data
```

## What's still a placeholder after Phase 2.4

- Store business info (category/description/social links/logo) — no backend field or endpoint (mismatch #1–3)
- Product editing, archiving, active/inactive toggle — no backend endpoint (mismatch #4)
- Product variant create/edit/delete — no backend endpoint at all (mismatch #5)
- Store verification workflow (mismatch #7)
- Analytics, Customers, Orders — no backend data model (mismatch #8)
- Billing, team management, API integration (Brand Settings) — no backend at all
- Bulk inventory stock update
