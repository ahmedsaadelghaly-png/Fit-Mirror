# Photography & Static Asset Architecture

`frontend/public/` had no assets at all before Phase 2.8 — this document
tracks the asset slots the Phase 2.8 visual refactor introduces, what each
one needs, and which are still standing in on `FashionImage`'s built-in
placeholder (see `shared/components/fashion-image.tsx`) pending real
photography.

This covers **static, design-time imagery only** (marketing/editorial
assets shipped with the app). User data imagery (wardrobe items, try-on
results, product photos a brand uploads) is dynamic and goes through
`ResolvedImage` (`shared/components/resolved-image.tsx`), which resolves
an S3 storage key at runtime — there is no static asset slot for that
content, and none is needed here.

## Folder layout

```
frontend/public/images/
├── editorial/   Wide/cinematic imagery for hero sections and section dividers (21:9)
├── products/    Reference garment-on-white product shots, for demo/seed content (1:1)
├── models/      Portrait model photography for the landing/marketing narrative (3:4)
└── textures/    Subtle background textures/gradients, if a section needs one beyond CSS
```

Every subfolder currently contains only a `.gitkeep` — no real files yet.
Any page requesting an image from these paths that doesn't exist will get
`FashionImage`'s abstract placeholder (a duotone ink/graphite panel with a
faint garment glyph), not a broken image — safe to ship without blocking
on photography, and each slot is discoverable by grepping for
`FashionImage`/`EditorialImage`/`ModelImage`/`ProductImage` usages with no
`src` prop.

## How to tell what's still a placeholder

`FashionImage` renders a small `photo needed` corner marker whenever
`process.env.NODE_ENV !== "production"` and no `src` was passed — visible
in local dev and Storybook, automatically absent from production builds.
Grep the codebase for `<EditorialImage`, `<ModelImage`, `<ProductImage`,
and `<FashionImage` calls with no `src` to get the exact list at any point
in time; the list below is the Phase 2.8 snapshot and will drift as later
stages add more.

## Shot list (post-Stage 7, actual call sites)

Every row below is a real, shipped `<FashionImage>`/`<EditorialImage>`/
`<ModelImage>` call in the codebase today (not a speculative plan) —
regenerate this table at any time with the grep in the section above.
All of them currently render the placeholder; none has a real photo yet.

| Slot | Component call site | Aspect | Notes |
|---|---|---|---|
| Landing hero | `app/(public)/page.tsx` — `EditorialHero`'s `media` | `editorial` (21:9) | The single most important image in the product — a model in motion trying something on, not a static product-on-white shot. |
| Per-capability narrative panels (×5: Virtual Try-On, Digital Wardrobe, AI Stylist, Size Recommendation, For Fashion Brands) | `app/(public)/page.tsx` — one `EditorialHero` per `capabilities` entry | `portrait` (`ModelImage`) | Alternating left/right; each panel needs a photo distinct from the others or the repetition reads as one recycled placeholder even after real photos land. |
| Features grid tiles (×5) | `app/(public)/features/page.tsx` | `landscape` | Smaller/secondary versions — can reuse the narrative-panel shots above at a different crop rather than requiring 5 more originals. |
| Auth panel | `layouts/auth-layout.tsx` | full-bleed behind the "mirror" sheen | Layered under the existing signature motion effect, not replacing it — see `docs/frontend/DESIGN_SYSTEM.md` "Motion". |
| Contact page | `app/(public)/contact/page.tsx` | `portrait` (`ModelImage`, decorative `alt=""`) | Purely supporting/balancing the two-column layout — lowest priority in this list. |

Empty states (wardrobe, saved looks, shopping, try-on history) were
evaluated but deliberately **not** given `FashionImage` treatment —
`components/ui/empty-state.tsx`'s existing icon+copy pattern already
reads clearly at that small a size, and duplicating the same abstract
placeholder glyph inside an already-small empty-state tile added visual
noise rather than polish (see Stage 4's `ResultPanel` idle-state
decision, which reached the same conclusion for the same reason).

Populate any row above by dropping a real file into the matching
`public/images/<folder>/` path and passing that path as `src` to the
corresponding component — no code changes beyond that one prop are
needed, since every consumer already renders the placeholder gracefully
in its absence.
