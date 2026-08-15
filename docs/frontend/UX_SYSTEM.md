# Global UX Systems (Phase 2.6)

## Toast notification system

`components/ui/toast.tsx` (Radix `@radix-ui/react-toast` primitives,
styled to match every other `components/ui/` component — `cva` variants,
`forwardRef`, `cn` merge) + `hooks/use-toast.ts` (the state manager — a
module-level reducer + listener array, not Zustand, so `toast(...)` is
callable from anywhere, including outside a React tree) +
`components/ui/toaster.tsx` (the renderer, mounted once in
`providers/app-providers.tsx`).

```ts
import { toast } from "@/hooks/use-toast";

toast({ title: "Product created", description: product.title });
toast({ title: "Something went wrong", variant: "destructive" });
```

**Applied as a real example** in `features/brand/components/products/
product-form.tsx` (create/update product success). Not retrofitted into
every existing mutation across Shopper/Brand/Admin in this pass — most of
those already show inline `role="status"`/`role="alert"` success/error
text (the established pattern since Phase 2.3), which remains valid; toast
is for the cases where a confirmation should be visible even after
navigating away from the form (e.g. the redirect-to-detail-page flow
`product-form.tsx` does immediately after success).

## Global notification center

`features/notifications/` — `store.ts` (Zustand; ephemeral client UI
state, matching `docs/frontend/FRONTEND_ARCHITECTURE.md`'s state-
management rule) + `notification-center.tsx` (the panel: mark-read,
dismiss, mark-all-read — all real interactions). `shared/components/
notification-bell.tsx` (previously a permanently-empty shell — no
notification system exists on the backend, see `backend/docs/
NOTIFICATIONS.md`'s planned outbox pattern) now reads a real unread count
from the store and renders the panel. Seeded with two representative
notifications so the panel demonstrates real interaction rather than
staying empty forever — still **not backed by any endpoint**; a real
implementation needs `GET /notifications` (poll or websocket) once the
backend has one.

## Global command palette

`features/command-palette/command-palette.tsx` — opens on Cmd+K/Ctrl+K
from anywhere (a `keydown` listener mounted once in `providers/app-
providers.tsx`), filters (plain substring match — **placeholder**, not
fuzzy search; no `cmdk` dependency added) the current role's nav items
from `config/navigation.ts` — the same array already driving each
dashboard's sidebar, so there's one source of truth for "what pages exist
for this role," not a second hand-maintained list. Selecting a result
navigates via `next/navigation`'s `useRouter` and closes the palette.

## Offline state / network status detector

`hooks/use-network-status.ts` — real (not simulated) `navigator.onLine` +
`online`/`offline` event listeners. `shared/components/offline-banner.tsx`
renders a visible banner when offline, mounted once in `app-providers.tsx`
above `{children}`. Known limitation, documented in the hook's own
docstring: `navigator.onLine` reflects network-interface status, not
"can this app actually reach the backend" — a captive portal or a fully
down backend with a live network interface won't trigger this banner. A
real connectivity probe (e.g. polling `GET /health`) would close that gap
but wasn't added in this pass to avoid a background poll running on every
page.

## Confirmation dialog system

`shared/components/confirm-dialog-provider.tsx` — `useConfirm()` returns
a promise-based `confirm({title, description, destructive?}) => Promise<boolean>`,
so a destructive action reads as:

```ts
const confirmed = await confirm({ title: "Suspend this store?", destructive: true });
if (!confirmed) return;
suspendMutation.mutate(...);
```

instead of hand-rolling a `<Dialog>` + local `open` state per call site.
Mounted once in `app-providers.tsx`. **Applied as a real example** to the
Admin Stores "Suspend" action (`features/admin/components/stores/
stores-table.tsx`) — the one existing destructive action retrofitted in
this pass; every other destructive action across Shopper/Brand/Admin
(deactivate user, flag/hide product, archive product, delete variant, ...)
still fires immediately on click, same as before. Adopting `useConfirm()`
there is the natural next step, not done everywhere here to keep this
pass's diff reviewable.

## Optimistic update helper

`hooks/use-optimistic-mutation.ts` — wraps TanStack Query's documented
optimistic-update recipe (snapshot → optimistic write → roll back
`onError` → refetch `onSettled`). Every existing mutation hook across
Phases 2.3–2.5 instead invalidates-and-refetches on success (simpler, but
the UI waits for the round-trip). This is a real, working alternative for
call sites where instant feedback matters more — not yet adopted by any
existing hook.

## Skeleton / empty / error states — already established, reviewed here

No new components were needed — `components/ui/skeleton.tsx`,
`empty-state.tsx`, and `error-state.tsx` (Phase 2.1) were already used
consistently across every list/detail view built in Phases 2.3–2.5 (loading
→ error → empty → success is the standing convention documented in each
phase's own `docs/frontend/*_APP.md`). This pass's contribution is the
`ErrorBoundary` (see `docs/frontend/OBSERVABILITY.md`) for the one failure
mode those three didn't cover: a render-time exception in an already-loaded
widget, not a fetch-time loading/error/empty state.
