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

## Shot list (Phase 2.8 snapshot)

| Slot | Aspect | Used by | Notes |
|---|---|---|---|
| Landing hero | `editorial` (21:9) | Public homepage hero | The single most important image in the product — a model in motion trying something on, not a static product-on-white shot. |
| "Virtual Try-On" story panel | `wide` (16:9) or `portrait` (3:4) | Landing page narrative section | Before/after or a garment mid-render, communicating the core mechanic without a screenshot. |
| "Digital Wardrobe" story panel | `wide`/`portrait` | Landing page narrative section | A flat-lay or rack composition — several garments, not one. |
| "Personal Stylist" story panel | `portrait` | Landing page narrative section | A styled outfit composition, not an icon. |
| "Smart Shopping" story panel | `wide` | Landing page narrative section | Product grid or discovery moment. |
| "For Fashion Brands" story panel | `wide` | Landing page narrative section | Editorial/studio photography tone, distinct from the consumer sections. |
| Auth panel (`AuthLayout`) | `portrait`/full-bleed | `/login`, `/register`, etc. | Currently a solid ink panel with the sheen effect and no imagery — a real photo here would substantially lift the first authenticated impression. |
| Empty states (wardrobe, saved looks, shopping) | `square`/`portrait` | Shopper feature empty states | Illustrative rather than literal — a soft abstract garment motif works here even before real photography exists. |

Populate any row above by dropping a real file into the matching
`public/images/<folder>/` path and passing that path as `src` to the
corresponding component — no code changes beyond that one prop are
needed, since every consumer already renders the placeholder gracefully
in its absence.
