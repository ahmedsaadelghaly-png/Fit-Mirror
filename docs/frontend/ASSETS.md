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

Since the photography pass (after Phase 3.1) every slot below has a real
photo; see "Photo credits & license". To regenerate or swap photos, edit
the list in `scripts/build_image_assets.py` and run
`python scripts/build_image_assets.py frontend/public/images` — it
downloads from the Unsplash CDN, crops to each slot's aspect around a
vertical focus point, and saves progressive JPEG q78 (keep files under
~300 KB).

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

## Seed product & wardrobe photos

Demo catalog/wardrobe images are user-data-style objects, so they live in
object storage, not `public/`: `backend/app/db/seed_assets/*.jpg` (800×800)
are uploaded by `python -m app.db.seed` under `seed-data/products/` and
`seed-data/wardrobe/`, and set as each demo product's `primary_image_key`
and every variant's `garment_image_key` (so catalog try-on works).

| File | Unsplash photo id |
|---|---|
| classic-cotton-tshirt.jpg | 1521572163474-6864f9cf17ab |
| slim-fit-denim-jeans.jpg | 1604176354204-9268737828e4 |
| lightweight-bomber-jacket.jpg | 1591047139829-d91aecb6caea |
| essential-black-tee.jpg | 1618354691373-d851c5c3a990 |
| graphic-print-tee.jpg | 1576566588028-4147f3842f27 |
| leather-biker-jacket.jpg | 1551028719-00167b16eac5 |
| red-evening-gown.jpg | 1612336307429-8a898d10e223 |
| grey-hoodie.jpg | 1556821840-3a63f95609a7 |
| white-sneakers.jpg | 1620799140408-edc6dcb6d633 |

## Photo credits & license

All photography in `public/images/` comes from [Unsplash](https://unsplash.com)
under the [Unsplash License](https://unsplash.com/license): free for
commercial and non-commercial use, no permission or attribution required
(we credit anyway). Files were cropped and re-encoded; source IDs below
resolve at `https://unsplash.com/photos/<id>` or
`https://images.unsplash.com/photo-<id>`.

| File | Unsplash photo id | Used on |
|---|---|---|
| models/woman-yellow.jpg | 1515886657613-9f3515b0c78f | Landing hero mosaic |
| models/man-suit.jpg | 1617137968427-85924c800a22 | Landing hero mosaic |
| models/girl-blue-wall.jpg | 1519457431-44ccd64a579b | Landing hero mosaic |
| models/woman-milan.jpg | 1539109136881-3be0616acf4b | Audience grid (Women), auth panel |
| models/man-leather.jpg | 1520975954732-35dd22299614 | Audience grid (Men) |
| models/girl-garden.jpg | 1518831959646-742c3a14ebf7 | Audience grid (Girls) |
| models/boy-skate.jpg | 1596870230751-ebdfce98ec42 | Audience grid (Boys) |
| models/woman-pink.jpg | 1581044777550-4cfa60707c03 | Virtual Try-On panel, About |
| models/man-flannel.jpg | 1607345366928-199ea26cfe3e | AI Stylist panel |
| models/woman-street.jpg | 1485968579580-b6d095142e6e | Size Recommendation panel, Contact |
| models/woman-teal.jpg | 1509631179647-0177331693ae | How it works (02) |
| models/man-shirt.jpg | 1531427186611-ecfd6d936c79 | How it works (03) |
| models/boy-bowtie.jpg | 1519238263530-99bdd11df2ea | About |
| editorial/shopping.jpg | 1483985988355-763728e1935b | Shopping Assistant panel |
| editorial/boutique.jpg | 1441986300917-64674bd600d8 | For Fashion Brands (/features) |
| editorial/store-rack.jpg | 1445205170230-053b83016050 | Landing brand banner |
| editorial/rail-neutral.jpg | 1558769132-cb1aea458c5e | Landing CTA background, About banner |
| products/flatlay-denim.jpg | 1516762689617-e1cffcef479d | Digital Wardrobe panel |
| products/flatlay-dark.jpg | 1544441893-675973e31985 | How it works (01) |
| products/knit-hanger.jpg | 1434389677669-e08b4cac3105 | (available) |
| products/kids-flatlay.jpg | 1622290291468-a28f7a7dc6a8 | (available) |
| products/rail-white.jpg | 1490481651871-ab68de25d43d | (available) |

## Demo catalog photos

`backend/app/db/seed_assets/` holds the seeded product photos. The six women's
products reuse photos from `frontend/public/images/` (same Unsplash License),
named after the garment. Tag a product with the audience its photo shows; use
`unisex` only for items that clearly suit both, since `unisex` appears under
both Men and Women.

## Body shape figures

`frontend/public/images/body-shapes/` holds one figure per body shape, named
`{category}-{shape}.webp`. To regenerate them (needs numpy and Pillow):

    python scripts/build_body_shape_figures.py frontend/public/images/body-shapes

Adult figures can come from real meshes instead. Run
`bash scripts/export_adult_body_meshes.sh` (Anny: Apache-2.0 code, CC0 data),
then `python scripts/render_body_meshes.py MESH_DIR frontend/public/images/body-shapes`.
Children's figures always stay abstract: the export refuses to go below adult age.
