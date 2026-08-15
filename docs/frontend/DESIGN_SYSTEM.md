# Design System

Visual direction: **luxury fashion + AI technology** — the restraint and
material confidence of Apple/Nike/Stripe/Linear/Shopify, applied to a
product about clothes and mirrors.

## Concept: "Graphite & Brass"

A near-black/bone neutral base (editorial restraint, not stark tech-black)
with a warm brass accent (a fashion metal — buttons, buckles, hardware —
not the terracotta/sage-green that's become an AI-product cliché) and a
cool "mirror" secondary accent used narrowly for focus states and one
signature motion effect. The palette deliberately avoids two overused
patterns: warm-cream-paper + serif + terracotta (reads as generic
"AI-generated editorial"), and stark near-black + a single acid accent
(reads as generic "AI dev tool"). Neither is what this product is.

## Color tokens

All colors are HSL CSS variables (`app/globals.css`), consumed via
Tailwind's `hsl(var(--x))` pattern — light/dark mode is a single variable
swap, never a duplicated component-level conditional.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `background` / `foreground` | bone `40 20% 97%` / ink `240 8% 10%` | ink `240 6% 7%` / bone `40 18% 95%` | Page background/text |
| `surface` / `surface-foreground` | white / ink | graphite `240 6% 11%` / bone | Cards, dialogs, dropdowns |
| `muted` / `muted-foreground` | warm-gray | dark warm-gray | Secondary backgrounds, disabled/quiet text |
| `border` / `input` | warm-gray hairline | graphite hairline | Dividers, input borders |
| `primary` / `brass` | brass `34 45% 48%` | brighter brass `36 55% 60%` | Primary CTAs, active nav, focus ring |
| `secondary` | neutral gray | dark neutral | Secondary buttons |
| `accent` | cool light gray-blue `213 16% 93%` | cool dark `213 14% 19%` | Hover backgrounds, dropdown highlight — a faint nod to "mirror" even in ordinary UI chrome |
| `mirror` / `mirror-soft` | steel `213 12% 58%` | brighter steel `213 18% 70%` | The signature sheen effect only — never a general utility color |
| `destructive` / `success` / `warning` | muted brick / sage / amber | brighter equivalents | Status semantics — desaturated to stay in-palette, not stock red/green/yellow |

**Why brass, specifically:** contrast-checked against its foreground —
brass background (`34 45% 48%`) with ink text (`240 10% 9%`) resolves to
roughly 6.8:1, comfortably passing WCAG AA even at normal text size, not
just for large button labels.

## Typography

| Role | Typeface | Why |
|---|---|---|
| Display / headings | **Space Grotesk** | Geometric grotesk with just enough personality to feel considered, not templated — distinct from the ubiquitous Inter-for-everything default, and not a serif (avoiding the cream-paper-editorial cliché) |
| Body | **Inter** | The right choice specifically *because* it's a neutral workhorse — personality lives in the display face, color, and motion, not in body text legibility |
| Data / labels / prices / SKUs / status | **JetBrains Mono** | Monospace numerals read as "precise, machine-verified" — a deliberate texture cue for the AI/technology half of the brand, used narrowly (never for prose) |

Type scale (`tailwind.config.ts` `fontSize`) uses tightening letter-spacing
as size increases (e.g. `-0.03em` at `5xl`) — standard practice for large
display type, where default letter-spacing reads as loose.

## Spacing & layout

- Base spacing follows Tailwind's default 4px-increment scale, extended
  with a few larger steps (`18`, `22`, `30` → 4.5rem/5.5rem/7.5rem) for
  generous section padding without resorting to arbitrary values.
- Container max-width caps at `1280px` (`2xl` breakpoint) with `1.5rem`
  side padding — enough to keep long-line-length text from feeling like a
  dense terminal, without the cramped feel of a narrower CMS-blog width.

## Radius

Small-to-medium radii throughout (`--radius: 0.5rem` default, up to
`--radius-xl: 1.25rem` for hero panels) — deliberately **not** the
"everything is `rounded-2xl`" look common in AI-tool templates. Crisp
corners read as precision (Linear, Stripe); the one large radius (`xl`) is
reserved for hero-scale surfaces, not applied uniformly.

## Shadows

Shadows are low-opacity and layered (`sm`/`DEFAULT`/`md`/`lg` in
`tailwind.config.ts`), keyed to a `--shadow-color` variable so dark mode
shadows are true black instead of a washed-out gray-on-black. A dedicated
`mirror` shadow (a faint cool-toned glow) exists only for the signature
reflective panel — never used as a general elevation utility.

## Motion

- Standard interactive transitions: 150–200ms, `ease` or the custom
  `signature` easing (`cubic-bezier(0.16, 1, 0.3, 1)` — a gentle
  decelerate, used for anything that should feel considered rather than
  snappy-mechanical, e.g. the sidebar collapse width transition).
- **Signature element — the "mirror sheen":** a light gradient sweep
  (`sheen-surface` + `sheen-animate` utilities in `app/globals.css`),
  used only on the `AuthLayout`'s reflective panel. This is the one
  branded motion effect in the system — a literal nod to "FitMirror" (a
  surface catching light) — and it is used **nowhere else**, so it stays
  recognizable rather than becoming wallpaper.
- **`prefers-reduced-motion`:** globally respected via a blanket
  `@media (prefers-reduced-motion: reduce)` rule in `app/globals.css` that
  collapses all animation/transition durations to near-zero — the sheen
  effect and every other transition comply automatically; no
  component-level opt-out logic needed.

## Dark mode / light mode

- Implemented via `next-themes` (`providers/theme-provider.tsx`), toggling
  a `.dark` class on `<html>` — every token above has a light and dark HSL
  value in `app/globals.css`, no component ever hardcodes a color.
- Defaults to `system` (respects OS preference), with an explicit
  Light/Dark/System picker (`shared/components/theme-toggle.tsx`).
- Brass is *brighter* in dark mode (`48%` → `60%` lightness) — a color
  that reads correctly against a bone background needs more luminance to
  read correctly against a near-black one; this is checked, not assumed.

## Responsive breakpoints

Standard Tailwind breakpoints (`sm:640px md:768px lg:1024px xl:1280px
2xl:1536px`) — kept default deliberately; there's no product-specific
reason to deviate, and non-standard breakpoints only cost future
contributors a lookup. The one responsive *behavior* decision worth
noting: dashboard layouts switch from a fixed sidebar (`DashboardSidebar`,
`md:flex`, hidden below `md`) to a slide-over sheet (`MobileNav`, `md:
hidden`) at the `md` breakpoint — a JS media-query hook is deliberately
**not** used for this switch (see `hooks/use-media-query.ts`'s docstring);
both components render, Tailwind's responsive classes decide visibility.

## Accessibility rules

- **Focus is always visible.** A global `:focus-visible` rule
  (`app/globals.css`) applies a 2px ring in the brand accent color with
  offset — no component removes focus outlines without replacing them.
- **Skip link.** Every layout's `<main>` has `id="main-content"`; the root
  layout renders a `.skip-link` that's visually hidden until focused.
- **Semantic landmarks.** `<header>`, `<nav aria-label="...">`, `<main>`
  in every layout — screen reader users can jump between regions.
- **Color is never the only signal.** `StatusChip` pairs color with both
  an icon and a text label; form field errors are announced via
  `aria-invalid` + `aria-describedby` pointing at the visible error text,
  not color alone.
- **Reduced motion is respected globally**, not per-component (see
  "Motion" above).
- **Contrast-checked palette.** Every foreground/background pairing above
  was chosen with a contrast ratio in mind, not just visual approximation
  (see the brass/ink calculation above as the representative example).
