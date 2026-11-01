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
  types/brand.ts                          Request/response types (StoreBusinessInfo, ProductCreateRequest, ...)
  api/brand/
    store.ts                              GET/PATCH /store/me, POST /store, GET /store/me/summary
    products.ts                           POST/GET /store/products
  features/brand/
    schemas.ts                            Zod: store basics, business info, product, variant
    lib/
      resolve-product.ts                  Server Product → ResolvedProduct (camelCase isArchived alias)
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
      settings/                          Account (name + password, shared with Shopper), store-settings link, billing/team/API placeholders
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
| Product list/create | `GET/POST /store/products` | Real — includes "Made for" (`audience`: women/men/girls/boys/unisex); girls'/boys' items are sized by height |
| Store edit (business info, logo) | `PATCH /store/me` | Real (Phase 3.2) |
| Product edit/archive/active-toggle | `PATCH /store/products/{id}` (`is_archived`, `is_active`) | Real (Phase 3.1) |
| Product variants (add/edit/delete) | `POST/PATCH/DELETE /store/products/{id}/variants[/{variant_id}]` | Real (Phase 3.1) — duplicate SKU (409) shown on the SKU field |
| Single product detail | `GET /store/products/{id}` exists | Still derived from the list query cache (one fewer request when arriving from the list) |
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

1–3. ~~No store update endpoint; no `category`/`description`/
   `social_links`; logo has nowhere to go.~~ **Resolved (Phase 3.2).**
   `PATCH /store/me` updates name, category, description, social links
   and `logo_image_key` (which must be an object key this account
   uploaded). `features/brand/hooks/use-store-business-info.ts` reads
   from `GET /store/me` and saves through it; the slug stays permanent.

4. ~~No product edit, archive, or active-toggle endpoint~~ — **resolved
   in Phase 3.1.** `api/brand/products.ts::updateProduct` calls
   `PATCH /store/products/{id}`; archiving is a real `is_archived` column
   (migration `a3c9d2e41b07`), independent of `is_active`. Archived and
   inactive products are hidden from shoppers (catalog, sizing, Shopping
   Assistant) but stay in the brand's own list.

5. ~~No product-variant endpoint~~ — **resolved in Phase 3.1.** Variant
   add/edit/delete call the real variant endpoints. SKUs are unique
   platform-wide; a clash surfaces under the SKU field.

6. **Single product detail is still derived from the list cache.** A
   `GET /store/products/{id}` now exists, but `use-product.ts` keeps
   reading the `["brand", "products"]` list query — arriving from the
   list is instant, and every mutation invalidates that one key.

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

## Archiving

Since Phase 3.1 there is no local product overlay — the former
`api/brand/product-overlay.ts` and its localStorage keys
(`fitmirror.product-overlay.{id}`) are gone; stale keys in a browser are
simply ignored. `features/brand/lib/resolve-product.ts` only adds the
camelCase `isArchived` alias the views were built against.

Products marked archived are excluded from every status filter except an
explicit "Archived" filter (`features/brand/components/products/product-
filters-bar.tsx`), so an archived product stays reachable to unarchive
rather than disappearing permanently.

## Store onboarding

The **basics** step (name + slug) creates the store with `POST /store`;
logo, category/description and social links each save with
`PATCH /store/me`. `features/brand/hooks/use-store-onboarding.ts`
persists step progress per user so a refresh mid-flow resumes at the
same step.

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

- Store verification workflow (mismatch #7)
- Analytics, Customers, Orders — no backend data model (mismatch #8)
- Billing, team management, API integration (Brand Settings) — no backend at all
- Bulk inventory stock update
