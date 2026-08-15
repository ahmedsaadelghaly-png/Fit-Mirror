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

## Phase 2.8: fashion-first visual layer

Phases 2.1–2.5 established the "Graphite & Brass" token system above and
proved it on real layouts, but composition stayed in generic-SaaS
patterns: icon-in-pill "AI-powered" badges, centered hero + button pair,
uniform icon-card feature grids, zero photography anywhere (`public/`
was empty). The tokens were never the problem — the composition was.
Phase 2.8 adds an editorial visual layer on top of the existing tokens
rather than replacing them.

### Card variants

`components/ui/card.tsx` now takes a `variant` prop (`cva`-based, same
pattern as `Button`/`Badge`):

| Variant | Look | Used for |
|---|---|---|
| `default` | Bordered, `shadow-xs` (unchanged from Phase 2.1–2.5) | Admin/data-table contexts — a card as a plain container |
| `flush` | No border/shadow/fill | Editorial copy blocks sitting directly on the page |
| `media` | Hairline border, `overflow-hidden`, no baked-in padding | Image-forward cards (product/look grids) |
| `elevated` | Border + `shadow-md` | Floating panels, featured callouts |

Existing `<Card>` usages are unaffected — `variant` defaults to `default`.

### Eyebrow labels

`Badge` gained an `eyebrow` variant: an uppercase, letter-spaced label
with a short leading rule, not a pill. Use this instead of an
icon-in-pill badge (`<Sparkles /> AI-powered...`) for section kickers —
the icon-pill pattern reads as a generic AI-product cliche at this
point. Status/count badges keep using the existing pill variants.

### Fashion imagery system

Two complementary image primitives, both plain `<img>` (not
`next/image`) so both stay Storybook-safe under the Vite-based runner
(see `docs/frontend/STORYBOOK.md`):

- **`ResolvedImage`** (`shared/components/resolved-image.tsx`, existing)
  — dynamic, S3-storage-key-backed content: wardrobe items, try-on
  results, product photos a brand uploaded. Resolution logic untouched
  by Phase 2.8; only its empty-state tile was restyled to match the
  system below.
- **`FashionImage`** (`shared/components/fashion-image.tsx`, new) —
  static design-time assets under `public/images/...`: marketing/
  editorial imagery. Named aspect-preset wrappers `ProductImage`
  (square), `ModelImage` (portrait), `EditorialImage` (cinematic wide)
  cover the common cases without hand-writing `aspect-[..]` per usage.

Both render the same placeholder treatment with no image available — a
duotone ink/graphite gradient with a faint garment glyph, not a broken
image icon — so every page is safe to ship ahead of real photography.
See `docs/frontend/ASSETS.md` for the full asset architecture and shot
list this stands in for.

Pass `alt=""` on either component for a purely decorative image (e.g. a
background panel behind copy that already says the same thing) — both
switch their placeholder tile to `aria-hidden` rather than `role="img"
aria-label=""`, which is a real WCAG violation (an element with
`role="img"` must have a non-empty accessible name). A real `<img alt="">`
is already valid on its own once a `src` exists; this only matters for
the no-image placeholder branch. Caught by `tests/e2e/accessibility.spec.ts`
in Stage 2 — re-run it after adding a new decorative usage.

### Editorial layout primitives

- **`FashionSection`** (`shared/components/editorial-section.tsx`) —
  the standard page-section shell (eyebrow/heading/description/actions,
  then body content), replacing the ad-hoc `container flex flex-col
  items-center gap-6 py-20` pattern every section previously hand-rolled.
- **`EditorialHero`** (`shared/components/editorial-hero.tsx`) — the
  large asymmetric two-column composition (copy half + image half,
  `reverse` to flip sides) for any page section that needs to make a
  visual case for itself, not just state a fact in a sentence.

Both are `next/link`-free (accept `actions`/`media` as pre-built
`ReactNode`) so they stay composable in Storybook without a framework
switch.

Both also take a `headingLevel` prop (`"h1" | "h2"`, default `"h2"` on
`FashionSection`/`"h1"` on `EditorialHero`) — a page must have exactly
one `h1`. Set it explicitly at every call site: `"h1"` on whichever
component renders a page's primary heading, `"h2"` on every other
section on that same page (e.g. the landing page's narrative sections
below its `EditorialHero`, or `FashionSection` reused as a page's sole
heading on `/features`, `/about`, `/pricing`, `/contact`, `/privacy`,
`/terms`). Getting this wrong silently drops a page's `h1` — Stage 2
caught this via `tests/e2e/accessibility.spec.ts` and
`tests/e2e/smoke.spec.ts`'s `getByRole("heading", {level: 1})`
assertions, not the type system, so re-run both after touching either
component's usage.

### Fashion-specific cards

`shared/components/cards/`: `LookCard` (image-dominant, gradient-scrim
caption overlay — saved looks, stylist suggestions) and `ProductCard`
(garment-on-white photo + quiet name/price metadata — catalog grids).
Both are generic presentational primitives (no domain typing), composed
by feature code that maps its own data into their props — kept that way
so the same two cards serve Shopper, Brand, and Stylist contexts rather
than one card type per feature.

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
