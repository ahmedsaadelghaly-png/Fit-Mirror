# Frontend Architecture

Phase 2.1 status: layout, design system, and routing foundation. No
business pages, no real auth flow beyond login/register, no mobile app.
See `ROADMAP.md` for what comes next.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui (Radix
primitives) · React Hook Form + Zod · TanStack Query · Zustand · Axios ·
Lucide Icons · ESLint · Prettier · Vitest · Playwright.

## Folder structure and what belongs where

```
frontend/
├── app/                 Next.js App Router: route groups, layouts, pages ONLY.
│                        No business logic here — a page imports from
│                        features/ and renders it.
├── features/            Feature-first modules: api.ts, schemas.ts, hooks/,
│                        components/ — one folder per product area
│                        (auth, contact, shopper, brand, admin, tryon). See
│                        features/auth/ for the reference structure.
├── shared/               Cross-feature, cross-cutting UI (Logo, ThemeToggle,
│                        PublicHeader, PublicFooter, Breadcrumbs,
│                        NotificationBell, UserMenu) — things used by
│                        layouts/multiple features but not feature-specific
│                        and not a generic primitive.
├── components/ui/       Generic, feature-agnostic primitives (Button, Card,
│                        Dialog, ...) — shadcn/ui-style, each with a
│                        colocated Storybook story (see
│                        docs/frontend/STORYBOOK.md). Never import from
│                        features/ here.
├── layouts/              The 5 page-chrome layouts (Public/Auth/Shopper/
│                        Brand/Admin) plus their shared building blocks
│                        (DashboardSidebar, DashboardHeader, MobileNav).
├── hooks/                Generic, reusable hooks (useMediaQuery, useMounted,
│                        useAuth re-export). Feature-specific hooks live in
│                        features/*/hooks/.
├── lib/                  Framework-agnostic utilities: cn(), cookies.ts,
│                        auth-token.ts, jwt.ts, auth-constants.ts, and
│                        stores/ (Zustand: ui-store, auth-store).
├── api/                  The single Axios client instance + interceptors
│                        (see docs/frontend/API_CLIENT.md). Feature-specific
│                        API calls live in features/*/api.ts and import
│                        this client — this folder stays thin.
├── providers/            App-wide React context/providers (Query, Theme,
│                        Auth — the real session-bootstrapping provider,
│                        see docs/frontend/AUTHENTICATION.md) plus the
│                        AppProviders composition root.
├── config/               Environment validation (Zod), site metadata,
│                        navigation config, and tokens/ (design tokens —
│                        see docs/frontend/THEME_SYSTEM.md).
├── types/                Domain/auth/API types mirroring backend schemas
│                        (see "Planned: typed API client generation" below).
├── middleware/           Real route-protection decision logic
│                        (auth-guard.ts) consumed by the root middleware.ts
│                        (which must stay at the project root — a Next.js
│                        requirement, not a choice).
├── assets/               icons/, images/ (a placeholder brand mark svg),
│                        fonts/ (empty — see its README, fonts load via
│                        next/font/google).
├── styles/               Non-token/non-utility CSS (currently empty).
├── .storybook/           Storybook config — see docs/frontend/STORYBOOK.md.
└── tests/                unit/ (Vitest + Testing Library), e2e/ (Playwright).
```

## Route groups vs. URL paths

Next.js route groups (`(public)`, `(auth)`, `(shopper)`, `(brand)`,
`(admin)`) organize layouts **without affecting the URL** — `(shopper)/
shopper/page.tsx` serves `/shopper`, not `/(shopper)/shopper`. Each group
has exactly one `layout.tsx` that wraps its pages in the corresponding
`layouts/*.tsx` component. See `docs/frontend/WEB_ROUTES.md` for the full
route table.

## State management: which tool for which job

| Kind of state | Tool | Why |
|---|---|---|
| Server data (jobs, products, user profile) | TanStack Query | Handles caching, refetching, loading/error states — don't duplicate this in Zustand |
| Cross-component UI state (sidebar collapse, mobile nav open) | Zustand (`lib/stores/ui-store.ts`) | Needed by unrelated components (header + sidebar), doesn't belong to server data |
| Auth session | `providers/auth-provider.tsx` (React Context) — PLACEHOLDER | Small, app-wide, read via a single `useAuth()` hook; not server data in the TanStack Query sense |
| Component-local state (form field focus, a single dropdown's open state) | `useState` | Default choice — reach for the above only when state genuinely needs to be shared |

## The API client

One Axios instance (`api/client.ts`) with a request interceptor attaching
`Authorization: Bearer <token>`, a response interceptor that silently
refreshes an expired token and retries once before giving up, and
`normalizeError()` turning every failure into one `ApiError` class. Full
detail: `docs/frontend/API_CLIENT.md`.

Feature code never imports `axios` directly — it imports `apiClient` from
`api/client.ts` and wraps calls in a feature-local `api.ts` (see
`features/auth/api.ts`), keeping endpoint URLs and request/response typing
in one place per feature.

## Auth — real as of Phase 2.2

Login, register, session persistence (cookie-based, so `middleware.ts` can
actually enforce route protection), refresh-on-401, logout, and
role-based redirects are all real, working code as of Phase 2.2 — not
placeholders. Full detail, including the session lifecycle diagram and
why cookies (not localStorage) were chosen: `docs/frontend/AUTHENTICATION.md`.

One documented placeholder remains: `features/auth/api.ts::forgotPassword`
simulates success rather than calling a real endpoint, because no backend
endpoint for it exists yet — see that file's docstring and
`docs/frontend/AUTHENTICATION.md` "Forgot password — a documented
placeholder".

## Planned: typed API client generation

Types in `types/domain.ts`, `types/auth.ts`, and `types/api.ts` are
hand-written to mirror the backend's Pydantic schemas (see backend
`docs/API_CONTRACTS.md`) — kept in sync manually, which will drift as both
sides evolve. Planned: generate these (and the `features/*/api.ts`
functions) from the backend's OpenAPI schema (FastAPI exposes one
automatically at `/openapi.json`), likely via `openapi-typescript` — not
done yet, to keep each phase scoped to what it's actually solving rather
than tooling for a problem that doesn't hurt yet.

## Testing strategy

- **Unit (Vitest + Testing Library):** pure functions (`lib/utils.ts`,
  Zod schemas) and component behavior in isolation (`Button`,
  `StatusChip`). Fast, no browser.
- **E2E (Playwright):** layout/routing smoke tests only in Phase 2.1 (see
  `tests/e2e/smoke.spec.ts`) — there's no real business flow yet to test
  end-to-end. Requires `npx playwright install` once (downloads browser
  binaries) before `npm run test:e2e` works.
- See `TESTING.md` (backend) for the platform-wide testing philosophy this
  mirrors: unit tests use fakes/mocks and need no external services; e2e
  tests need the real app running (`webServer` in `playwright.config.ts`
  starts `npm run dev` automatically).

## A note on this sandbox's build verification

Every command below was actually run against this codebase during Phase
2.1's build (`npm run typecheck`, `npm run lint`, `npm run test`,
`npm run build`) — this caught and fixed two real bugs (a Radix `Slot`
child-count violation in `Button`, and passing icon component references
across a Server/Client Component boundary in the dashboard layouts) before
they shipped. The one thing that could not be verified in this sandbox is
`next/font/google`'s fetch of font files from `fonts.googleapis.com`
(no network egress to that domain here) — the build was confirmed to
otherwise succeed by temporarily substituting system fonts, then the real
Google Fonts configuration was restored. This will fetch normally in any
environment with standard internet access (local dev, CI, deployment).
