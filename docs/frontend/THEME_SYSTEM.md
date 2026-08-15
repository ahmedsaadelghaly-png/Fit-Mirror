# Theme System

## Architecture

```
config/tokens/*.ts        Single source of truth for design values (colors, typography, spacing, ...)
tailwind.config.ts        Imports every token module — no hardcoded values duplicated here
app/globals.css           CSS custom properties (:root and .dark) — the runtime source colors.ts mirrors
providers/theme-provider.tsx   Wraps next-themes; toggles the .dark class on <html>
shared/components/theme-toggle.tsx   Light/Dark/System picker UI
```

## Design tokens (`config/tokens/`)

Phase 2.2 extracted every design value that was previously hardcoded
inline in `tailwind.config.ts` into dedicated, imported modules:

| File | Exports | Single source of truth for... |
|---|---|---|
| `colors.ts` | `colorTokens`, `rawColorValues` | References `app/globals.css`'s CSS variables (mirrors, doesn't replace them — see below) |
| `typography.ts` | `fontFamilyTokens`, `fontSizeTokens` | Fully self-contained — `tailwind.config.ts` imports these directly |
| `spacing.ts` | `spacingTokens`, `containerTokens` | Fully self-contained |
| `radius.ts` | `radiusTokens`, `rawRadiusValues` | References `app/globals.css`'s CSS variables (same mirroring pattern as colors) |
| `shadows.ts` | `boxShadowTokens` | Fully self-contained (values reference the `--shadow-color` CSS variable as strings) |
| `motion.ts` | `keyframeTokens`, `animationTokens`, `easingTokens`, `durationTokens` | Fully self-contained |
| `breakpoints.ts` | `breakpointTokens`, `breakpointQueries` | Fully self-contained — also usable from plain JS/`useMediaQuery`, not just Tailwind |
| `index.ts` | re-exports all of the above | Import `@/config/tokens` for anything, or a specific file for one concern |

**Why colors/radius "mirror" CSS variables instead of generating them:**
Tailwind's dark-mode strategy here is a single CSS variable swap (`.dark`
class flips every `--variable`), which needs those variables defined in
actual CSS (`app/globals.css`) — a TypeScript module can't emit CSS custom
properties without a build step nobody has set up yet. So `colors.ts` and
`radius.ts` hold `hsl(var(--x))`-style **references** for
`tailwind.config.ts` to consume (keeping Tailwind's generated utilities
pointed at the same variable names), plus the raw values as a documented,
type-safe mirror of what's in `globals.css`. **If you change a color or
radius value, you currently must update both places** — `app/globals.css`
(the runtime source) and `config/tokens/colors.ts` or `radius.ts` (the
mirror) — see "Planned: single-sourced tokens" below.

Typography/spacing/shadows/motion/breakpoints have **no** such
duplication — `tailwind.config.ts` imports them directly as the only copy.

### Planned: single-sourced tokens

Fully eliminating the colors/radius mirror would mean either (a) a small
build step that generates `app/globals.css`'s variable block from
`colors.ts`/`radius.ts`, or (b) moving color definition into
JS-in-CSS via PostCSS-JS. Neither is implemented — flagged here rather
than silently left as a footgun. In the meantime, this is a two-file edit,
not a many-file hunt: only `globals.css` and the relevant `tokens/*.ts`
file.

## Light mode / Dark mode / System

- `providers/theme-provider.tsx` wraps `next-themes`'s `ThemeProvider`
  with `attribute="class"` (adds/removes `.dark` on `<html>`) and
  `defaultTheme="system"` (respects the OS preference on first visit,
  before any explicit user choice).
- `shared/components/theme-toggle.tsx` renders a dropdown with three
  options — Light, Dark, System — calling `next-themes`'s `setTheme(...)`.
- `app/layout.tsx` sets `suppressHydrationWarning` on `<html>`, which is
  required with `next-themes`: the server can't know the client's
  preferred theme before hydration, so a one-render mismatch is expected
  and intentionally suppressed rather than "fixed" (fixing it would mean
  removing the optimization entirely).

## Persistent user preference

`next-themes` persists the choice to `localStorage` (key: `theme`)
automatically — no custom persistence code was written for this, since
`next-themes` already solves it correctly (including avoiding a
flash-of-wrong-theme on reload via an inline script it injects). This is
a separate persistence mechanism from the Zustand-based `useAuthStore`
persistence (see `docs/frontend/AUTHENTICATION.md`) — two different
concerns, two different (appropriate) tools.

## Avoiding hydration mismatches

Any component reading the *resolved* theme (not just rendering a
toggle that calls `setTheme`) must guard against rendering before the
client has mounted — see `hooks/use-mounted.ts` and its use in
`shared/components/theme-toggle.tsx` (`disabled={!mounted}` on the
trigger button, so it doesn't render a theme-dependent icon state that
could mismatch the server-rendered markup).

## `prefers-reduced-motion`

Not part of the light/dark system, but adjacent: a single global rule in
`app/globals.css` collapses every animation/transition duration to near
-zero when the OS-level reduced-motion preference is set — see
`docs/frontend/DESIGN_SYSTEM.md` "Motion" for the full rationale. This
means the signature "mirror sheen" effect (`AuthLayout`'s reflective
panel) and every other transition in the app comply automatically, with
no per-component opt-out logic required.

## Adding a new token

1. Decide which `config/tokens/*.ts` file it belongs in (or whether it
   needs a new file).
2. Add it there, typed, with a comment explaining its purpose.
3. Import it into `tailwind.config.ts`'s relevant `theme.extend` key.
4. If it's a color or radius value, ALSO add the corresponding
   `--variable` to both the `:root` and `.dark` blocks in
   `app/globals.css` (see "Planned: single-sourced tokens" above for why
   this is currently a two-file edit).
