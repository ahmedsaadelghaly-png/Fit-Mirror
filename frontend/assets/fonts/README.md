# assets/fonts

Empty by design. All three typefaces (Space Grotesk, Inter, JetBrains
Mono) are loaded via `next/font/google` in `app/layout.tsx`, which
self-hosts and subsets them automatically at build time — no static font
files need to live in this repo. See
`docs/frontend/DESIGN_SYSTEM.md` "Typography" for the typeface choices,
and `docs/frontend/THEME_SYSTEM.md` for how font variables reach
`app/globals.css`.

If a future brand refresh requires a custom (non-Google-Fonts) typeface,
its files would go here, loaded via `next/font/local` instead.
