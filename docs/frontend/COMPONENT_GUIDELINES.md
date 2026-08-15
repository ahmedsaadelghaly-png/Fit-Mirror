# Component Guidelines

## Where a component belongs

| If it's... | It goes in... | Example |
|---|---|---|
| A generic, feature-agnostic primitive | `components/ui/` | `Button`, `Card`, `Dialog` |
| Used by multiple layouts/features but isn't a generic primitive | `shared/components/` | `Logo`, `ThemeToggle`, `NotificationBell` |
| Specific to one product area | `features/<area>/components/` | `features/auth/components/LoginForm` |
| Part of page chrome (header/sidebar/nav) | `layouts/` | `DashboardSidebar`, `MobileNav` |

If you're unsure between `shared/components/` and `components/ui/`: does
it know anything about the *product* (auth, wardrobe, a User type) or just
render whatever props it's given? The latter is `components/ui/`.

## Every `components/ui/` primitive follows this shape

```tsx
import * as SomePrimitive from "@radix-ui/react-something"; // if wrapping Radix
import * as React from "react";

import { cn } from "@/lib/utils";

const MyComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("base-tailwind-classes", className)} {...props} />
  ),
);
MyComponent.displayName = "MyComponent";

export { MyComponent };
```

- **Always `forwardRef`.** Consumers may need the DOM node (focus
  management, measuring, Radix composition via `asChild`).
- **Always accept and merge `className`** via `cn(...)`, with the
  caller's classes last — so a consumer can override any default.
- **Always spread `...props`** after explicit props — don't swallow
  `aria-*`, `data-*`, or event handlers a caller passes.
- **Variants use `class-variance-authority` (cva)**, not manual ternary
  chains — see `components/ui/button.tsx` or `badge.tsx` for the pattern.
  This keeps variant logic declarative and keeps `VariantProps<typeof x>`
  available for the exported prop types.

## Reusability rules

- A `components/ui/` component **never imports from `features/`**. If a
  component needs product-specific data, that's a sign it belongs in
  `features/*/components/` instead, composing a `components/ui/`
  primitive rather than being one.
- Prefer **composition over configuration**. `Card`/`CardHeader`/
  `CardTitle`/`CardContent` are separate exports you compose, not one
  `Card` with fifteen boolean props. If you're adding a 6th boolean prop
  to a primitive, stop and ask whether the caller should just compose
  sub-parts instead.
- **`asChild` for polymorphism, not a `component` prop.** `Button` supports
  `asChild` (via Radix `Slot`) so it can render as a styled `<Link>` — see
  `components/ui/button.tsx`. This is the established pattern for "render
  as a different element but keep the styling"; don't invent a parallel
  `as="a"` API.

  **Radix `Slot` gotcha (a bug this codebase actually hit — see
  `docs/frontend/FRONTEND_ARCHITECTURE.md`'s verification note):** `Slot`
  requires **exactly one** element child. Don't render a conditional
  sibling (`{condition && <X />}`) alongside `{children}` when `asChild`
  is true — `false`/`null` still counts as an extra child in React's
  array and breaks `Slot`. `Button`'s `asChild` branch handles this by
  returning early with only `{children}`, skipping the loading-spinner
  branch entirely (asChild + isLoading isn't a meaningful combination
  anyway — asChild is for rendering as a `<Link>`, which doesn't have a
  loading state).

## Server vs. Client Components (a bug this codebase actually hit)

Passing a **function** (including a React component reference, like a
`lucide-react` icon used as a config value) as a prop from a Server
Component into a Client Component fails at build time — React Server
Components can't serialize functions across that boundary. This bit the
three dashboard layouts (`layouts/*-dashboard-layout.tsx`), which import
`navItems` (containing `icon: LucideIcon`) from `config/navigation.ts` and
pass them into `DashboardSidebar`/`MobileNav` (both Client Components).

**The fix, and the rule going forward:** if a layout/page needs to pass
data containing component references into a Client Component child, the
simplest correct move is marking the passing component `"use client"`
too (which is what all three dashboard layouts do — they have no
server-only data fetching in Phase 2.1, so there's no cost to this). If a
component **does** need to stay a Server Component, the alternative is
having the Client Component import the config directly (module imports
aren't subject to the serialization boundary) rather than receiving it as
a prop — prefer the `"use client"` fix when the parent has no other reason
to be server-rendered, since it's simpler and one line.

## Accessibility checklist for every new interactive component

- [ ] Reachable and operable by keyboard alone (Radix primitives handle
      this for anything built on them — verify for anything hand-rolled,
      like `FileDropzone`'s `role="button"` + `onKeyDown` handling).
- [ ] Has an accessible name (visible text, or `aria-label` when the
      visible content is icon-only — see every icon-only `Button` in this
      codebase for the pattern).
- [ ] Focus state is visible (inherited automatically from the global
      `:focus-visible` rule — don't override it away).
- [ ] Error/status states use `role="alert"` or `role="status"` plus a
      text label, not color alone (see `ErrorState`, `StatusChip`).

## Testing expectations

Every `components/ui/` primitive that has non-trivial logic (not just
styling) should have a unit test — see `tests/unit/components/button.test.tsx`
and `status-chip.test.tsx` for the reference pattern (render, query by
role/text, assert). Purely presentational components with zero logic
(e.g. `Skeleton`) don't need one.
