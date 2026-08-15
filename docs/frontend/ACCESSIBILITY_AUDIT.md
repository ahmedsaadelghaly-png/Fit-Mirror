# Accessibility Audit (Phase 2.6)

Builds on `docs/frontend/DESIGN_SYSTEM.md` "Accessibility rules" (Phase
2.1) and `docs/frontend/COMPONENT_GUIDELINES.md` "Accessibility checklist"
— this audit re-verifies those rules held up across the ~150 components
added in Phases 2.3–2.5 (Shopper/Brand/Admin), not just the original
design-system primitives, and documents what changed in this pass.

## What was already solid (verified, not re-built)

- **Focus rings**: global `:focus-visible` rule in `app/globals.css`, used
  everywhere — no component overrides it away.
- **Skip link**: `app/layout.tsx` renders `.skip-link` targeting
  `#main-content`, present on every dashboard layout
  (`layouts/*-dashboard-layout.tsx`).
- **Reduced motion**: global `@media (prefers-reduced-motion: reduce)`
  rule in `app/globals.css` — disables all animation/transition duration,
  not per-component opt-out.
- **Keyboard navigation + focus trapping for Dialog/DropdownMenu/Select/
  Tabs**: all Radix UI primitives, which implement WAI-ARIA authoring
  practices (focus trap, `Escape` to close, arrow-key navigation) out of
  the box — verified by reading each `components/ui/*.tsx` wrapper, none
  of which override Radix's built-in keyboard handling.
- **Icon-only buttons have `aria-label`**: consistent across all three
  phases — every `<Button variant="ghost" size="icon">` with no visible
  text (row action menus, close buttons, ...) was given a descriptive
  `aria-label` (e.g. `` `Actions for ${user.email}` ``, not a generic
  "Actions"), not just an icon.
- **Form error accessibility**: every React Hook Form field across
  Shopper/Brand/Admin follows the same pattern established in Phase 2.2 —
  `aria-invalid={!!errors.field}`, `aria-describedby="field-error"` on the
  input, and the error text itself has `id="field-error"`.
- **Dialog accessibility**: every `components/ui/dialog.tsx` usage has a
  `DialogTitle` (required for the dialog's accessible name) — confirmed by
  grepping every `<DialogContent>` usage across `features/*/components/`
  for a sibling `<DialogTitle>`.
- **Loading states are accessible**: `Skeleton` (`role="status"
  aria-label="Loading"`) and `LoadingState` (`role="status"`) are used
  consistently, never a bare spinner with no accessible announcement.

## What changed in this pass

- **Table accessibility**: `components/ui/table.tsx`'s `TableHead` now
  defaults to `scope="col"` (previously a plain `<th>` with no `scope`
  attribute at all) — this was a real, if easy to miss, gap: every data
  table across Users/Stores/Products/Try-On Jobs/Audit Logs/Feature Flags
  (Phases 2.3–2.5) rendered semantically-correct `<table>`/`<thead>`/
  `<tbody>` markup but without `scope`, screen readers can't reliably
  associate a cell with its column header in a complex table. One
  component-level fix, applied everywhere automatically.
- **Automated axe-core scans**: `tests/e2e/accessibility.spec.ts` (see
  "Automated testing" below) — didn't exist before this phase.
- **`ErrorBoundary`'s fallback** (`components/error-boundary/error-boundary.tsx`)
  reuses `components/ui/error-state.tsx`, which already has `role="alert"` —
  a caught render error is announced to assistive tech, not just visually
  swapped.

## Color contrast review

Not re-run with a fresh contrast-ratio tool in this pass — `DESIGN_SYSTEM.md`
documents the *original* palette was contrast-checked (Phase 2.1), and no
new colors were introduced in Phases 2.3–2.6 (every badge/status/alert
color across Shopper/Brand/Admin reuses the same `success`/`warning`/
`destructive`/`muted` tokens). **Recommended before launch**: run the
existing palette through a tool like the Chrome DevTools contrast checker
or `axe-core`'s `color-contrast` rule (included in the automated scan
below) against the actual rendered dashboard pages, not just the original
marketing-page-focused review.

## Screen reader labels — spot-checked, not exhaustively re-verified

Every table row's primary action, every icon-only button, and every
status badge reviewed in this pass had either visible text or an
`aria-label`/`aria-hidden` pairing already in place. Given the volume of
components (three full dashboards), this was a spot-check across a
representative sample of each feature area's list/detail/form views, not
a line-by-line audit of every one of the ~150 components — the automated
scan below is the more exhaustive check.

## Automated testing

`tests/e2e/accessibility.spec.ts` — `@axe-core/playwright` scans against
every public + auth page (`/`, `/features`, `/pricing`, `/about`,
`/contact`, `/privacy`, `/terms`, `/login`, `/register`,
`/forgot-password`), asserting zero WCAG 2.1 A/AA violations. Run via
`npm run test:e2e:a11y`.

**Not covered by the automated scan**: the Shopper/Brand/Admin dashboard
pages. Those all require a faked authenticated session (see
`tests/e2e/shopper-smoke.spec.ts`/`brand-smoke.spec.ts`/`admin-smoke.spec.ts`'s
`signInAs*` helpers) — extending `accessibility.spec.ts` to sign in and
scan a representative dashboard page per role is the natural next step,
not done here to keep this new suite runnable with zero setup (no cookie/
route-mocking boilerplate to reuse yet at the point this file was
written).

## What automated scans can't catch

axe-core catches missing labels, invalid ARIA, contrast failures, and
similar mechanically-detectable issues — it **cannot** verify:

- Whether tab order is *logical* (only that elements are reachable).
- Whether a screen reader announces content in a sensible sequence.
- Whether custom keyboard shortcuts (e.g. the command palette's Cmd+K,
  see `docs/frontend/UX_SYSTEM.md`) conflict with assistive technology's
  own shortcuts.
- Whether error messages are *understandable*, only that they're
  programmatically associated with their field.

Manual keyboard-only and screen-reader (VoiceOver/NVDA) passes over the
three dashboards are recommended before launch and are not part of this
automated pass.

## Accessibility checklist (for new components going forward)

Same checklist as `docs/frontend/COMPONENT_GUIDELINES.md`, restated here
for visibility:

- [ ] Reachable and operable by keyboard alone.
- [ ] Has an accessible name (visible text, or `aria-label` when icon-only).
- [ ] Focus is visible and never removed without a replacement.
- [ ] Color is never the only signal (pair with an icon and/or text).
- [ ] Loading/error/empty states use `role="status"`/`role="alert"` as appropriate.
- [ ] Any new `<table>` uses `TableHead` (not a bare `<th>`) for the `scope="col"` default.
- [ ] Any new `<Dialog>` has a `DialogTitle` (visually hidden via `sr-only` if it shouldn't be visible).
