# Storybook

## Setup

```
.storybook/main.ts       Framework config, story glob, path-alias resolution
.storybook/preview.tsx    Global CSS import, light/dark theme decorator + toolbar switch
components/ui/*.stories.tsx   One story file per documented component, colocated with its source
```

Run locally:

```bash
npm run storybook          # dev server on http://localhost:6006
npm run build-storybook    # static build to storybook-static/ (verifies stories actually compile)
```

## Why `@storybook/react-vite`, not `@storybook/nextjs`

None of the ten components with stories (see below) use `next/image`,
`next/font`, or `next/link` directly — they're framework-agnostic UI
primitives. The lighter Vite-based framework builds faster and avoids
pulling in Next.js-specific tooling for components that don't need it.
**If a future story needs a component that uses Next-specific APIs**
(e.g. a layout using `next/link`), either mock that API in the story or
revisit the framework choice — this is a real constraint, not an
oversight.

## Path aliases

Storybook's Vite build doesn't read `tsconfig.json`'s `paths` the way
Next.js does automatically — `.storybook/main.ts` adds the
`vite-tsconfig-paths` plugin specifically so `@/components/ui/button`
-style imports resolve identically to how they do in the actual app. This
is the **same tsconfig.json**, not a duplicated alias map — one source of
truth (compare to how `vitest.config.ts` instead hand-maintains its own
alias list; `vite-tsconfig-paths` is the better pattern and worth applying
there too in a future cleanup).

## Theme decorator

`.storybook/preview.tsx` adds a `theme` global with a toolbar toggle
(Light/Dark) that wraps every story in a `<div className={theme === "dark"
? "dark" : undefined}>` — the same mechanism `next-themes` uses in the
real app (a class on an ancestor element, not a separate stylesheet). This
means every story is theme-accurate without needing two copies of each
story.

**Known trade-off:** fonts are not loaded via `next/font` here (that's a
Next.js-only API), so stories render with each font family's fallback
(system sans/monospace) rather than Space Grotesk/Inter/JetBrains Mono.
Colors, spacing, radius, shadows, and motion are all accurate (they come
from `app/globals.css` and Tailwind, both of which work identically
outside Next.js); only the exact typeface differs from the real app.

## Stories written (Phase 2.2)

| Component | File | Notable variants |
|---|---|---|
| Button | `components/ui/button.stories.tsx` | All variants, loading, disabled, icon-only, `asChild` rendering as a real `<a>` |
| Card | `components/ui/card.stories.tsx` | Full composition (header/content/footer), header-only |
| Input | `components/ui/input.stories.tsx` | With label, invalid state, disabled |
| Dialog | `components/ui/dialog.stories.tsx` | Full open/close interaction (a real Radix dialog, not a static mock) |
| Badge | `components/ui/badge.stories.tsx` | All six variants |
| EmptyState | `components/ui/empty-state.stories.tsx` | With/without icon, with an action button |
| ErrorState | `components/ui/error-state.stories.tsx` | Default copy, custom copy, with a retry handler |
| LoadingState | `components/ui/loading-state.stories.tsx` | Default and custom label |
| FileDropzone | `components/ui/file-dropzone.stories.tsx` | Default, custom copy, disabled |
| StatusChip | `components/ui/status-chip.stories.tsx` | All four `tryon_jobs.status` values side by side |

All ten were verified by actually running `npm run build-storybook` and
confirming all 28 story variants appear in the generated manifest — not
just written and assumed to work.

## Stories written (Phase 2.3)

Six additional stories cover the shopper-specific components that don't
depend on `next/link` (the other Next-specific API constraint noted
above). `shared/components/resolved-image.tsx` and `shared/components/
image-upload-field.tsx` were written to use a plain `<img>` instead of
`next/image` specifically so they'd be story-able under this Vite-based
setup — see their docstrings.

| Component | File | Notable variants |
|---|---|---|
| ImageUploadField | `shared/components/image-upload-field.stories.tsx` | Idle, uploading (with progress), success, error |
| ResolvedImage | `shared/components/resolved-image.stories.tsx` | Unresolvable key (the common case — no public bucket URL configured), no key |
| QueueStatusCard | `features/tryon/components/queue-status-card.stories.tsx` | Empty, with active (pending/processing) jobs |
| TryOnJobCard | `features/tryon/components/tryon-job-card.stories.tsx` | All four `tryon_jobs.status` values, including the failed-state retry action |
| SavedLookCard | `features/shopper/components/saved-looks/saved-look-card.stories.tsx` | Labeled and unlabeled look |
| WardrobeItemCard | `features/shopper/components/wardrobe/wardrobe-item-card.stories.tsx` | Uploaded item, catalog item with no label — wrapped in a `QueryClientProvider` decorator since the card calls `useDeleteWardrobeItem()` internally |

Components that compose `next/link` (every dashboard card, `TryOnHistoryResultCard`,
form pages, etc.) are intentionally not storified yet — per the constraint
above, they'd need either a `next/link` mock or a switch to
`@storybook/nextjs`, neither of which was in scope for Phase 2.3.

## Stories written (Phase 2.4)

Five more stories for Brand-specific components, same `next/link`-free
constraint as Phase 2.3.

| Component | File | Notable variants |
|---|---|---|
| ProductStatusBadge | `features/brand/components/products/product-status-badge.stories.tsx` | Active, inactive, archived |
| StoreSummaryCard | `features/brand/components/dashboard/store-summary-card.stories.tsx` | Verified, pending verification |
| TryOnActivityCard | `features/brand/components/dashboard/tryon-activity-card.stories.tsx` | No activity (empty state), with activity |
| VerificationStatusSection | `features/brand/components/profile/verification-status-section.stories.tsx` | Verified, pending |
| PlannedSectionCard | `features/brand/components/settings/planned-section-card.stories.tsx` | Billing, team management, API integration |

## Stories written (Phase 2.5)

Six more stories for Admin-specific components, same `next/link`-free
constraint as Phase 2.3/2.4.

| Component | File | Notable variants |
|---|---|---|
| MockedBadge | `features/admin/components/mocked-badge.stories.tsx` | Default label, custom label |
| ServiceStatusBadge | `features/admin/components/service-status-badge.stories.tsx` | Healthy, degraded, down, unknown |
| UserRoleBadge | `features/admin/components/users/user-role-badge.stories.tsx` | Shopper, brand admin, platform admin |
| WorkerStatusCard | `features/admin/components/queue/worker-status-card.stories.tsx` | Online, degraded, offline |
| MiniBarChart | `features/admin/components/reports/mini-bar-chart.stories.tsx` | Growing trend, flat trend |
| ReportCard | `features/admin/components/reports/report-card.stories.tsx` | User growth, failed jobs |

## Writing a new story

Follow the existing pattern: colocate `<component>.stories.tsx` next to
the component, `title: "UI/<ComponentName>"`, `tags: ["autodocs"]` for an
auto-generated docs page, and prefer `argTypes` controls for variant
props (`select` for a fixed set of string variants) over writing a
separate story per variant where a control would do — reserve separate
named stories for states that need distinct content/composition (like
`Dialog`'s interactive open state, or `EmptyState`'s "with action"
variant).

## What's not covered yet

Only the twenty-seven components listed above (ten from Phase 2.2, six
from Phase 2.3, five from Phase 2.4, six from Phase 2.5) have stories.
Every other `components/ui/` primitive (Select, Checkbox, Tabs, Avatar,
Table, Skeleton, Progress, Dropdown, Label) and every `shared/components/`,
`layouts/`, or `next/link`-composing `features/*/components/` file does
not yet — expanding coverage is a natural next step but wasn't part of
Phase 2.2, 2.3, 2.4, or 2.5's explicit scope.
