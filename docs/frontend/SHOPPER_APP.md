# Shopper Web App (Phase 2.3)

The full Shopper experience: dashboard, onboarding, body profile, photo
upload, virtual try-on, try-on history, wardrobe, saved looks, AI Stylist
(Beta), Shopping Assistant (Beta), and settings. Everything
under `app/(shopper)/shopper/*` is now real — no more static placeholder
pages. Brand dashboard, admin dashboard, and mobile app remain out of
scope, per the Phase 2.3 brief.

## Folder structure

```
frontend/
  types/shopper.ts                       Request/response types (BodyProfileUpsertRequest, SavedLook, ...)
  api/shopper/
    body-profile.ts                      GET/PUT /users/me/body-profile
    wardrobe.ts                          POST/GET/DELETE /wardrobe
    tryon.ts                             POST /tryon/upload-url, POST/GET /tryon, GET /tryon/{id}
    upload.ts                            Shared pre-signed-URL upload flow + client-side file validation
    saved-looks.ts                       GET/POST/DELETE /saved-looks
    stylist.ts                           POST /stylist/suggestions (rule-based outfits from the wardrobe)
    shopping.ts                          POST /shopping/ask
    catalog.ts                           GET /catalog/products (Shop page; ?ids= for Shopping Assistant matches)
    sizing.ts                            POST /sizing/recommend ("Find my size", per family profile)
    shopping.ts                          501-backed placeholder (POST /shopping/ask)
  features/shopper/
    schemas.ts                           Zod schemas: body measurements, style preferences, wardrobe item, stylist/shopping requests
    hooks/                               One TanStack Query hook per file (see features/auth/ for the established pattern)
    components/
      body-profile-form.tsx              Full body profile form (standalone page)
      dashboard/                         Welcome, recent try-ons, wardrobe/saved-looks summaries, quick actions, AI Stylist + Shopping Assistant placeholder cards
      onboarding/                        4-step stepper (style, body profile, photo, completion)
      wardrobe/                          Grid, filters, item card, add-item dialog
      saved-looks/                       Grid, card, details dialog (drawer placeholder)
      settings/                          Notifications placeholder, theme shortcut (name + password: features/auth/components/account-settings.tsx)
      stylist/, shopping/                Chat UIs badged "Beta"; shopping/product-matches.tsx renders matches + sizing
  features/tryon/
    hooks/                               use-create-tryon-job, use-tryon-job (polling), use-tryon-jobs (list + client filter)
    components/                          Split workspace (user photo / garment / result panels), queue status, history sidebar, history page, job cards
  shared/components/
    image-upload-field.tsx               Reusable drag/drop + preview + progress + error UI (used by body profile, wardrobe, try-on)
    resolved-image.tsx                   Storage-key → image, with a placeholder fallback (see "No image download URL" below)
  shared/utils/resolve-image-url.ts      Best-effort storage-key → URL resolution
  app/(shopper)/shopper/
    page.tsx                             Dashboard
    onboarding/page.tsx
    profile/page.tsx                     Body profile
    wardrobe/page.tsx
    tryon/page.tsx                       Virtual try-on workspace
    tryon/history/page.tsx
    looks/page.tsx                       Saved looks
    stylist/page.tsx                     AI Stylist
    shopping/page.tsx                    Shopping Assistant
    settings/page.tsx
```

Every `page.tsx` is a thin server component that sets `metadata` and
renders one client `*View`/`*Flow`/`*Workspace` component, matching the
`app/(auth)/login/page.tsx` → `LoginForm` pattern from Phase 2.2. Business
logic lives in `features/*/hooks`, not in pages or components.

## API integration

| Feature | Backend endpoint(s) | Status |
|---|---|---|
| Body profile | `GET/PUT /users/me/body-profile` | Real — measurements, body type, style preferences, reference photo |
| Family profiles | `GET/POST /users/me/body-profiles`, `PUT/DELETE /users/me/body-profiles/{id}` | Real — switcher + "Add family member" on Body Profile (`features/shopper/components/family/`) |
| Shop + catalog try-on | `GET /catalog/products`, `POST /sizing/recommend` (`body_profile_id`), `POST /tryon` (`product_variant_id`) | Real — `/shopper/shop`; the try-on dialog (`features/shopper/components/shop/product-try-on-dialog.tsx`) picks who it's for (a matching child for kids' items), recommends and preselects their size, uses that profile's saved photo, and opens `/shopper/tryon?job=<id>`. Shows what shoppers say about the fit and whether the brand's own chart was used; "Already own it?" sends `POST /sizing/feedback` |
| Wardrobe | `POST/GET /wardrobe`, `DELETE /wardrobe/{id}` | Real |
| Virtual try-on | `POST /tryon/upload-url`, `POST /tryon`, `GET /tryon/{id}`, `GET /tryon` | Real |
| Uploads (all surfaces) | `POST /tryon/upload-url` + direct `PUT` to the pre-signed URL | Real — one endpoint reused for body-profile/wardrobe/try-on images, see backend docs/STORAGE.md |
| Saved looks | `GET/POST /saved-looks`, `DELETE /saved-looks/{id}` | Real — a saved look points at a completed try-on job |
| AI Stylist | `POST /stylist/suggestions`, `POST /stylist/suggestions/{id}/feedback` | Real — each reply shows the suggested pieces with "Love it" / "Not for me" (`features/shopper/components/stylist/suggested-outfit.tsx`); feedback trains the shopper's taste model |
| Shopping Assistant | `POST /shopping/ask` + `GET /catalog/products?ids=` | Real (rule-based v1) — matches render as product cards |
| Body type (women / men / girls / boys + shape) | `PUT /users/me/body-profile` (`body_category`, `body_shape`) | Real — illustrated picker (`features/shopper/components/body-shape/`), shapes listed in `features/shopper/body-shapes.ts` mirror the backend |
| Size recommendation | `POST /sizing/recommend` | Real — "Find my size" on each Shopping Assistant match; a 422 (missing measurements) links to Body Profile |
| Settings → Profile details | `GET/PATCH /users/me` | Real — edit name; email and role read-only |
| Settings → Password | `POST /users/me/password` | Real — keeps this session, signs out the others |
| Settings → Notifications | none | UI-only placeholder |

## API contract mismatches (documented per the Phase 2.3 rules)

The spec asked for several fields/behaviors the backend doesn't support
yet. Rather than silently dropping them or faking persistence, each is
handled with a typed frontend adapter and called out here:

1. ~~Body profile style fields.~~ **Resolved (Phase 3.2).**
   `preferred_fit`, `favorite_colors` and `style_preferences` are body
   profile fields; the AI Stylist favours items in the favourite colours.

2. ~~Reference photo isn't saveable.~~ **Resolved (Phase 3.2).**
   `BodyProfileUpsert.reference_image_key` accepts a key this account
   uploaded (`422` for anyone else's).

3. **No wardrobe `color` field or filters.** `WardrobeItemRead` has no
   `color` field, and `GET /wardrobe` accepts no query params at all
   (category/source/search all happen client-side against the full list).
   The spec's "filter by category/color/source" is implemented as
   category + source only — see `types/shopper.ts` `WardrobeFilters`.

4. ~~No image download-URL endpoint.~~ **Resolved.** Every read API still
   returns opaque storage *keys* (`image_key`, `result_image_key`, ...),
   never a URL — but `GET /tryon/download-url?object_key=...` now exists
   (wires up `StorageService.get_download_url`, previously unused) and
   `shared/components/resolved-image.tsx` calls it via
   `hooks/use-resolved-image-url.ts` whenever the faster, synchronous
   `shared/utils/resolve-image-url.ts` path (which still requires
   `NEXT_PUBLIC_S3_PUBLIC_BASE_URL`, i.e. a public bucket — not configured
   in local dev) comes up empty. Real images now render for wardrobe
   items, try-on results, saved looks, etc.; the placeholder tile is only
   shown while resolving or if a key genuinely has nothing behind it.

5. ~~Saved Looks has no backend resource.~~ **Resolved (Phase 3.2).**
   `saved_looks` table + `/saved-looks`; looks now follow the account
   across devices.

6. ~~No endpoint to edit profile details.~~ **Resolved (Phase 3.2).**
   `PATCH /users/me` (name) and `POST /users/me/password`.

7. ~~`TryOnJobRead` has no timestamp.~~ **Resolved (Phase 3.2).** Jobs
   carry `created_at`; `features/tryon/lib/job-display.ts::newestFirst`
   sorts everywhere (the old "reverse the list" approximation actually
   showed oldest first, since the API was already newest first).

8. ~~Try-on history search is an inert placeholder.~~ **Resolved (Phase
   3.2).** Catalog try-ons carry `product_title` / `size_label`; history
   cards show them and search matches the product name.

## Onboarding

`features/shopper/hooks/use-onboarding.ts` persists step progress to
`localStorage` per user (`style → body-profile → photo → complete`), so
navigating away mid-flow and coming back resumes at the same step. Each
step can also be skipped independently. This progress state is separate
from the actual data the steps collect (body profile via `PUT
/users/me/body-profile`, style preferences included) — skipping a
step just advances the stepper without saving that step's fields.

## Virtual Try-On flow

1. Upload a user photo and a garment photo (`features/shopper/hooks/
   use-upload.ts` → `POST /tryon/upload-url` → direct `PUT` to storage →
   `object_key` stored in local state).
2. `POST /tryon` with both keys → `202 { job_id, status: "pending" }`.
3. `features/tryon/hooks/use-tryon-job.ts` polls `GET /tryon/{job_id}`
   every 2s until `completed`/`failed`.
4. Completed: result preview, a before/after tab, "Save look" (`POST /saved-looks`), and disabled
   download/share buttons explicitly marked "coming soon" (per spec, these
   are UI placeholders, not implemented).
5. Failed: inline error + retry (re-submits the same two image keys as a
   new job).

The AI service's try-on pipeline is an explicit placeholder (see
`ai-service/app/pipelines/placeholder_tryon_pipeline.py`) — jobs complete
quickly today. Polling is written status-driven, not timing-assumption-
driven, so it keeps working once a real (slower) model replaces it.

## Testing

Unit tests (Vitest + Testing Library), added under `tests/unit/`:

- `features/shopper-schemas.test.ts` — body measurement bounds/optionality, wardrobe item validation
- `api/upload.test.ts` — client-side file validation (mime type, size limit)
- `features/tryon-hooks.test.tsx` — `useCreateTryOnJob` / `useTryOnJob`, with `@/api/shopper/tryon` mocked

Playwright smoke tests, added at `tests/e2e/shopper-smoke.spec.ts`:

- Shopper dashboard, body profile, virtual try-on, and wardrobe pages —
  each faked into an authenticated session via a `fm_access_token` cookie
  (the same cookie `middleware/auth-guard.ts` reads) holding an
  unsigned-but-well-formed JWT, with backend endpoints stubbed via
  `page.route` to match the documented response shapes. There's still no
  seeded backend account for a true login-driven e2e flow — see
  `docs/frontend/AUTHENTICATION.md`; this is the same gap that doc already
  called out.
- Route-protection checks for the four new routes (unauthenticated →
  `/login?redirectTo=...`), extending the existing pattern in
  `tests/e2e/smoke.spec.ts`.

Storybook: six new component stories for shopper-specific components that
don't depend on `next/link` — see `docs/frontend/STORYBOOK.md` "Stories
written (Phase 2.3)" for the full list and why `next/link`-composing
components (most page-level cards) aren't storified yet.

## Run / test commands

```bash
# Dev server
cd frontend && npm run dev              # http://localhost:3000/shopper (requires backend running for real data)

# Type check / lint
npm run typecheck
npm run lint

# Unit tests
npm run test                            # vitest run
npm run test:coverage

# Playwright e2e (starts its own dev server; backend calls are mocked in the shopper smoke tests)
npx playwright install                  # one-time
npm run test:e2e

# Storybook
npm run storybook                       # http://localhost:6006
npm run build-storybook                 # verifies all stories compile
```

## What's still a placeholder after Phase 2.3

- AI Stylist and Shopping Assistant are rule-based v1 engines (badged "Beta")
- Download / Share actions on a completed try-on result
- Account deletion and Notification preferences
- A real side-anchored "drawer" for saved look details (currently a centered dialog — `components/ui/dialog.tsx` is the only modal primitive today)
